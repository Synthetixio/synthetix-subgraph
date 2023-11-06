import { Address, Bytes, store } from '@graphprotocol/graph-ts';
import { NewAccount as NewAccountEvent } from '../generated/subgraphs/perps/smartmargin_factory_0/Factory';
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  ConditionalOrderPlaced as ConditionalOrderPlacedEvent,
  ConditionalOrderPlaced1 as ConditionalOrderPlacedEvent1,
  ConditionalOrderFilled as ConditionalOrderFilledEvent,
  ConditionalOrderFilled1 as ConditionalOrderFilled1Event,
  ConditionalOrderFilled2 as ConditionalOrderFilled2Event,
  ConditionalOrderCancelled as ConditionalOrderCancelledEvent,
  DelegatedAccountAdded as DelegatedAccountAddedEvent,
  DelegatedAccountRemoved as DelegatedAccountRemovedEvent,
} from '../generated/subgraphs/perps/smartmargin_events_2/Events';
import {
  DelegatedAccount,
  FuturesOrder,
  SmartMarginAccount,
  SmartMarginAccountTransfer,
  SmartMarginOrder,
} from '../generated/subgraphs/perps/schema';
import { ZERO, ZERO_ADDRESS, strToBytes } from './lib/helpers';

export function handleNewAccount(event: NewAccountEvent): void {
  // handle new account event for smart margin account factory
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

export function handleDelegatedAccountAdded(event: DelegatedAccountAddedEvent): void {
  let id = strToBytes(event.params.caller.toHex().concat('-').concat(event.params.delegate.toHex()));
  let entity = DelegatedAccount.load(id);

  if (entity == null) {
    entity = new DelegatedAccount(id);
  }

  entity.caller = event.params.caller;
  entity.delegate = event.params.delegate;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleDelegatedAccountRemoved(event: DelegatedAccountRemovedEvent): void {
  let id = strToBytes(event.params.caller.toHex().concat('-').concat(event.params.delegate.toHex()));
  let entity = DelegatedAccount.load(id);

  if (entity != null) {
    store.remove('DelegatedAccount', id.toHexString());
  }
}

export function handleDeposit(event: DepositEvent): void {
  // handle deposit event for smart margin account
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
  // handle withdraw event for smart margin account
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
  // handle order placed event for smart margin account
  // creates a new entity to store the order
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
  futuresOrderEntity.reduceOnly = event.params.reduceOnly;

  futuresOrderEntity.save();
}

export function handleOrderPlacedV2(event: ConditionalOrderPlacedEvent1): void {
  // handle order placed event for smart margin account
  // creates a new entity to store the order
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
  futuresOrderEntity.reduceOnly = event.params.reduceOnly;

  futuresOrderEntity.save();
}

export function handleOrderV1Filled(event: ConditionalOrderFilledEvent): void {
  handleOrderFilled(event, 'CHAINLINK');
}

export function handleOrderV2Filled(event: ConditionalOrderFilled1Event): void {
  const v1Event = new ConditionalOrderFilledEvent(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters,
    event.receipt,
  );

  handleOrderFilled(v1Event, 'CHAINLINK');
}

export function handleOrderV2FilledWithPriceOracle(event: ConditionalOrderFilled2Event): void {
  const priceOracle = event.params.priceOracle === 0 ? 'PYTH' : 'CHAINLINK';
  const v1Params = event.parameters.filter((value) => {
    return value.name !== 'priceOracle';
  });

  const v1Event = new ConditionalOrderFilledEvent(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    v1Params,
    event.receipt,
  );
  handleOrderFilled(v1Event, priceOracle);
}

function handleOrderFilled(event: ConditionalOrderFilledEvent, priceOracle: string): void {
  // handle order filled event for smart margin account
  // update the order status to filled
  const smAccountAddress = event.params.account as Address;

  const futuresOrderEntityId = `SM-${smAccountAddress.toHexString()}-${event.params.conditionalOrderId.toString()}`;
  const futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
  if (futuresOrderEntity) {
    // update the order status
    futuresOrderEntity.status = 'Filled';
    futuresOrderEntity.timestamp = event.block.timestamp;
    futuresOrderEntity.priceOracle = priceOracle;

    const smartMarginOrder = getOrCreateSmartMarginOrder(smAccountAddress, futuresOrderEntity.marketKey);
    smartMarginOrder.orderType = futuresOrderEntity.orderType;
    smartMarginOrder.recordTrade = true;

    futuresOrderEntity.save();
    smartMarginOrder.save();
  }
}

export function handleOrderCancelled(event: ConditionalOrderCancelledEvent): void {
  // handle order cancelled event for smart margin account
  // update the order status to cancelled
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
  // helper function to get or create a smart margin order entity
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
