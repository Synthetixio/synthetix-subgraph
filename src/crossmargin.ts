import { Address, BigInt, DataSourceContext } from '@graphprotocol/graph-ts';
import { NewAccount as NewAccountEvent } from '../generated/subgraphs/futures/crossmargin_factory/MarginAccountFactory';
import {
  OrderPlaced as OrderPlacedEvent,
  OrderFilled as OrderFilledEvent,
  OrderCancelled as OrderCancelledEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from '../generated/subgraphs/futures/templates/MarginBase/MarginBase';
import { MarginBase } from '../generated/subgraphs/futures/templates';
import {
  CrossMarginAccount,
  FuturesOrder,
  FuturesPosition,
  FuturesStat,
  FuturesTrade,
  CrossMarginAccountTransfer,
} from '../generated/subgraphs/futures/schema';
import { BPS_CONVERSION, ETHER } from './lib/helpers';

// temporary cross-margin fee solution
let CROSSMARGIN_ADVANCED_ORDER_BPS = BigInt.fromI32(3);

export function handleNewAccount(event: NewAccountEvent): void {
  // create a new entity to store the cross-margin account owner
  const cmAccountAddress = event.params.account as Address;
  let crossMarginAccount = CrossMarginAccount.load(cmAccountAddress.toHex());

  if (crossMarginAccount == null) {
    crossMarginAccount = new CrossMarginAccount(cmAccountAddress.toHex());
    crossMarginAccount.owner = event.params.owner;
    crossMarginAccount.save();
  }

  // create a new MarginBase contract for event listeners
  let context = new DataSourceContext();
  context.setString('owner', event.params.owner.toHex());
  MarginBase.createWithContext(cmAccountAddress, context);
}

export function handleOrderPlaced(event: OrderPlacedEvent): void {
  const marketAsset = event.params.marketKey;

  // look up the cross margin account address
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;

  // load or create the order
  const futuresOrderEntityId = `CM-${sendingAccount.toHexString()}-${event.params.orderId.toString()}`;
  let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
  if (futuresOrderEntity == null) {
    futuresOrderEntity = new FuturesOrder(futuresOrderEntityId);
  }

  // fill in the data and save
  futuresOrderEntity.orderType =
    event.params.orderType === 0 ? 'Limit' : event.params.orderType === 1 ? 'StopMarket' : 'Market';
  futuresOrderEntity.status = 'Pending';
  futuresOrderEntity.asset = marketAsset;
  futuresOrderEntity.account = account;
  futuresOrderEntity.abstractAccount = sendingAccount;
  futuresOrderEntity.size = event.params.sizeDelta;
  futuresOrderEntity.targetPrice = event.params.targetPrice;
  futuresOrderEntity.marginDelta = event.params.marginDelta;
  futuresOrderEntity.orderId = event.params.orderId;
  futuresOrderEntity.timestamp = event.block.timestamp;

  futuresOrderEntity.save();
}

export function handleOrderFilled(event: OrderFilledEvent): void {
  const futuresOrderEntityId = `CM-${event.params.account.toHexString()}-${event.params.orderId.toString()}`;
  const futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
  if (futuresOrderEntity) {
    // update the order status
    futuresOrderEntity.status = 'Filled';
    futuresOrderEntity.timestamp = event.block.timestamp;
    futuresOrderEntity.save();

    // update the trade type
    // need to iterate through logs to find the most recent trade
    const maxLogIndex = event.logIndex;
    for (let inc = maxLogIndex.toI32(); inc >= 0; inc--) {
      const futuresTradeEntityId = `${event.transaction.hash.toHex()}-${inc}`;
      let tradeEntity = FuturesTrade.load(futuresTradeEntityId);

      const positionEntityId = tradeEntity ? tradeEntity.positionId : '';
      let positionEntity = FuturesPosition.load(positionEntityId);
      let statEntity = FuturesStat.load(futuresOrderEntity.account.toHex());

      if (tradeEntity && positionEntity && statEntity) {
        tradeEntity.orderType = futuresOrderEntity.orderType;

        // update fees and pnl
        const feePaid = tradeEntity.size
          .abs()
          .times(tradeEntity.price)
          .div(ETHER)
          .times(CROSSMARGIN_ADVANCED_ORDER_BPS)
          .div(BPS_CONVERSION);
        tradeEntity.feesPaid = tradeEntity.feesPaid.plus(feePaid);

        positionEntity.feesPaid = positionEntity.feesPaid.plus(feePaid);
        positionEntity.pnlWithFeesPaid = positionEntity.pnl
          .minus(positionEntity.feesPaid)
          .plus(positionEntity.netFunding);

        statEntity.feesPaid = statEntity.feesPaid.plus(feePaid);
        statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);

        tradeEntity.save();
        positionEntity.save();
        statEntity.save();
        break;
      }
    }
  }
}

export function handleOrderCancelled(event: OrderCancelledEvent): void {
  const futuresOrderEntityId = `CM-${event.params.account.toHexString()}-${event.params.orderId.toString()}`;
  let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
  if (futuresOrderEntity) {
    // update the order status
    futuresOrderEntity.status = 'Cancelled';
    futuresOrderEntity.timestamp = event.block.timestamp;
    futuresOrderEntity.save();
  }
}

export function handleDeposit(event: DepositEvent): void {
  let sendingAccount = event.params.user;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  if (crossMarginAccount) {
    const accountOwner = crossMarginAccount.owner;

    let crossMarginTransfer = new CrossMarginAccountTransfer(
      sendingAccount.toHex() + '-' + event.transaction.hash.toHex(),
    );

    crossMarginTransfer.account = accountOwner;
    crossMarginTransfer.abstractAccount = sendingAccount;
    crossMarginTransfer.timestamp = event.block.timestamp;
    crossMarginTransfer.amount = event.params.amount;
    crossMarginTransfer.save();
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  let sendingAccount = event.params.user;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  if (crossMarginAccount) {
    const accountOwner = crossMarginAccount.owner;

    let crossMarginTransfer = new CrossMarginAccountTransfer(
      sendingAccount.toHex() + '-' + event.transaction.hash.toHex(),
    );

    crossMarginTransfer.account = accountOwner;
    crossMarginTransfer.abstractAccount = sendingAccount;
    crossMarginTransfer.timestamp = event.block.timestamp;
    crossMarginTransfer.amount = event.params.amount.times(BigInt.fromI32(-1));
    crossMarginTransfer.save();
  }
}
