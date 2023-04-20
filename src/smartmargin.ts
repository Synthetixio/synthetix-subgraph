import { Address, Bytes } from '@graphprotocol/graph-ts';
import { NewAccount as NewAccountEvent } from '../generated/subgraphs/perps/smartmargin_factory/Factory';
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  ConditionalOrderPlaced as ConditionalOrderPlacedEvent,
  ConditionalOrderFilled as ConditionalOrderFilledEvent,
  ConditionalOrderCancelled as ConditionalOrderCancelledEvent,
} from '../generated/subgraphs/perps/smartmargin_events/Events';
import {
  FuturesOrder,
  SmartMarginAccount,
  SmartMarginAccountTransfer,
  SmartMarginOrder,
} from '../generated/subgraphs/perps/schema';
import { ZERO, ZERO_ADDRESS } from './lib/helpers';

export function handleNewAccount(event: NewAccountEvent): void {
  // create a new entity to store the cross-margin account owner
  const smAccountAddress = event.params.account as Address;
  let smartMarginAccount = SmartMarginAccount.load(smAccountAddress.toHex());

  if (smartMarginAccount == null) {
    smartMarginAccount = new SmartMarginAccount(smAccountAddress.toHex());
    smartMarginAccount.owner = event.params.creator;
    smartMarginAccount.version = event.params.version;
    smartMarginAccount.save();
  }
}

export function handleDeposit(event: DepositEvent): void {
  // get the user smart margin account
  const userAccount = event.params.user;
  const smartMarginAccount = event.params.account;

  let smartMarginTransfer = new SmartMarginAccountTransfer(
    smartMarginAccount.toHex() + '-' + event.transaction.hash.toHex(),
  );

  smartMarginTransfer.account = userAccount;
  smartMarginTransfer.abstractAccount = smartMarginAccount;
  smartMarginTransfer.timestamp = event.block.timestamp;
  smartMarginTransfer.size = event.params.amount;
  smartMarginTransfer.txHash = event.transaction.hash.toHex();
  smartMarginTransfer.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  // get the user smart margin account
  const userAccount = event.params.user;
  const smartMarginAccount = event.params.account;

  let smartMarginTransfer = new SmartMarginAccountTransfer(
    smartMarginAccount.toHex() + '-' + event.transaction.hash.toHex(),
  );

  smartMarginTransfer.account = userAccount;
  smartMarginTransfer.abstractAccount = smartMarginAccount;
  smartMarginTransfer.timestamp = event.block.timestamp;
  smartMarginTransfer.size = event.params.amount.neg();
  smartMarginTransfer.txHash = event.transaction.hash.toHex();
  smartMarginTransfer.save();
}

export function handleOrderPlaced(event: ConditionalOrderPlacedEvent): void {
  const marketKey = event.params.marketKey;

  // look up the cross margin account address
  const smAccountAddress = event.params.account as Address;
  let smartMarginAccount = SmartMarginAccount.load(smAccountAddress.toHex());
  const account = smartMarginAccount ? smartMarginAccount.owner : smAccountAddress;

  // load or create the order
  const futuresOrderEntityId = `SM-${smAccountAddress.toHexString()}-${event.params.conditionalOrderId.toString()}`;
  let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
  if (futuresOrderEntity == null) {
    futuresOrderEntity = new FuturesOrder(futuresOrderEntityId);
  }

  // fill in the data and save
  futuresOrderEntity.size = event.params.sizeDelta;
  futuresOrderEntity.marketKey = marketKey;
  futuresOrderEntity.account = account;
  futuresOrderEntity.abstractAccount = smAccountAddress;
  futuresOrderEntity.orderId = event.params.conditionalOrderId;
  futuresOrderEntity.targetPrice = event.params.targetPrice;
  futuresOrderEntity.marginDelta = event.params.marginDelta;
  futuresOrderEntity.timestamp = event.block.timestamp;
  futuresOrderEntity.txnHash = event.transaction.hash;
  futuresOrderEntity.orderType =
    event.params.conditionalOrderType === 0
      ? 'Limit'
      : event.params.conditionalOrderType === 1
      ? 'StopMarket'
      : 'Market';
  futuresOrderEntity.status = 'Pending';
  futuresOrderEntity.keeper = ZERO_ADDRESS;

  futuresOrderEntity.save();
}

export function handleOrderFilled(event: ConditionalOrderFilledEvent): void {
  const smAccountAddress = event.params.account as Address;

  const futuresOrderEntityId = `SM-${smAccountAddress.toHexString()}-${event.params.conditionalOrderId.toString()}`;
  const futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
  if (futuresOrderEntity) {
    // update the order status
    futuresOrderEntity.status = 'Filled';
    futuresOrderEntity.timestamp = event.block.timestamp;

    const smartMarginOrder = getOrCreateSmartMarginOrder(smAccountAddress, futuresOrderEntity.marketKey);
    smartMarginOrder.orderType = futuresOrderEntity.orderType;
    smartMarginOrder.recordTrade = true;

    futuresOrderEntity.save();
    smartMarginOrder.save();
  }
}

export function handleOrderCancelled(event: ConditionalOrderCancelledEvent): void {
  const smAccountAddress = event.params.account as Address;

  const futuresOrderEntityId = `SM-${smAccountAddress.toHexString()}-${event.params.conditionalOrderId.toString()}`;
  const futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);

  if (futuresOrderEntity) {
    // update the order status
    futuresOrderEntity.status = 'Cancelled';
    futuresOrderEntity.timestamp = event.block.timestamp;
    futuresOrderEntity.save();
  }
}

function getOrCreateSmartMarginOrder(account: Address, marketKey: Bytes): SmartMarginOrder {
  const smOrderEntityId = account.toHex() + '-' + marketKey.toString();
  let smartMarginOrderEntity = SmartMarginOrder.load(smOrderEntityId);
  if (smartMarginOrderEntity == null) {
    smartMarginOrderEntity = new SmartMarginOrder(smOrderEntityId);
    smartMarginOrderEntity.account = account;
    smartMarginOrderEntity.recordTrade = false;
    smartMarginOrderEntity.marketKey = marketKey;
    smartMarginOrderEntity.feesPaid = ZERO;
  }
  return smartMarginOrderEntity;
}
