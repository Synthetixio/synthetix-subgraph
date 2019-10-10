import { EthereumEvent } from '@graphprotocol/graph-ts';

import {
  SynthWithdrawal as SynthWithdrawalEvent,
  SynthDeposit as SynthDepositEvent,
  SynthDepositRemoved as SynthDepositRemovedEvent,
  SynthDepositNotAccepted as SynthDepositNotAcceptedEvent,
  ClearedDeposit as ClearedDepositEvent,
} from '../generated/Depot/Depot';
import { UserAction, ClearedDeposit } from '../generated/schema';

function createUserAction(event: EthereumEvent): UserAction {
  let entity = new UserAction(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.network = 'mainnet';
  return entity;
}

export function handleSynthWithdrawal(event: SynthWithdrawalEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.type = 'withdrawl';
  entity.save();
}

export function handleSynthDeposit(event: SynthDepositEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.depositIndex = event.params.depositIndex;
  entity.type = 'deposit';
  entity.save();
}

export function handleSynthDepositRemoved(event: SynthDepositRemovedEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.depositIndex = event.params.depositIndex;
  entity.type = 'removal';
  entity.save();
}

export function handleSynthDepositNotAccepted(event: SynthDepositNotAcceptedEvent): void {
  let entity = createUserAction(event);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.minimum = event.params.minimum;
  entity.type = 'unaccepted';
  entity.save();
}

export function handleClearedDeposit(event: ClearedDepositEvent): void {
  let entity = new ClearedDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.fromAddress = event.params.fromAddress;
  entity.toAddress = event.params.toAddress;
  entity.fromETHAmount = event.params.fromETHAmount;
  entity.toAmount = event.params.toAmount;
  entity.depositIndex = event.params.depositIndex;
  entity.network = 'mainnet';
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.save();
}
