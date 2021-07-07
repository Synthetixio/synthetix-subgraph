import { ethereum } from '@graphprotocol/graph-ts';

import {
  SynthWithdrawal as SynthWithdrawalEvent,
  SynthDeposit as SynthDepositEvent,
  SynthDepositRemoved as SynthDepositRemovedEvent,
  SynthDepositNotAccepted as SynthDepositNotAcceptedEvent,
  ClearedDeposit as ClearedDepositEvent,
  Exchange as ExchangeEvent,
} from '../generated/subgraphs/depot/Depot_0/Depot';
import { UserAction, ClearedDeposit, Exchange } from '../generated/subgraphs/depot/schema';
import { toDecimal } from './lib/util';

function createUserAction(event: ethereum.Event): UserAction {
  let entity = new UserAction(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.network = 'mainnet';
  return entity;
}

export function handleSynthWithdrawal(event: SynthWithdrawalEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = toDecimal(event.params.amount);
  entity.type = 'withdrawl';
  entity.save();
}

export function handleSynthDeposit(event: SynthDepositEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = toDecimal(event.params.amount);
  entity.depositIndex = event.params.depositIndex;
  entity.type = 'deposit';
  entity.save();
}

export function handleSynthDepositRemoved(event: SynthDepositRemovedEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = toDecimal(event.params.amount);
  entity.depositIndex = event.params.depositIndex;
  entity.type = 'removal';
  entity.save();
}

export function handleSynthDepositNotAccepted(event: SynthDepositNotAcceptedEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = toDecimal(event.params.amount);
  entity.minimum = event.params.minimum;
  entity.type = 'unaccepted';
  entity.save();
}

export function handleClearedDeposit(event: ClearedDepositEvent): void {
  let entity = new ClearedDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.fromAddress = event.params.fromAddress;
  entity.toAddress = event.params.toAddress;
  entity.fromETHAmount = toDecimal(event.params.fromETHAmount);
  entity.toAmount = toDecimal(event.params.toAmount);
  entity.depositIndex = event.params.depositIndex;
  entity.network = 'mainnet';
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.save();
}

export function handleExchange(event: ExchangeEvent): void {
  let entity = new Exchange(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.from = event.transaction.from;
  entity.fromCurrency = event.params.fromCurrency;
  entity.fromAmount = toDecimal(event.params.fromAmount);
  entity.toCurrency = event.params.toCurrency;
  entity.toAmount = toDecimal(event.params.toAmount);
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.network = 'mainnet';
  entity.save();
}
