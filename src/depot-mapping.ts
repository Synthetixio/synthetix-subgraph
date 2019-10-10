import { EthereumEvent } from '@graphprotocol/graph-ts';

import {
  SynthWithdrawal as SynthWithdrawalEvent,
  SynthDeposit as SynthDepositEvent,
  SynthDepositRemoved as SynthDepositRemovedEvent,
  SynthDepositNotAccepted as SynthDepositNotAcceptedEvent,
  ClearedDeposit as ClearedDepositEvent,
} from '../generated/Depot/Depot';
import { UserAction, ClearedDeposit } from '../generated/schema';

function createUserAction(event: EthereumEvent, network: string = 'mainnet'): UserAction {
  let entity = new UserAction(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.network = network;
  return entity;
}

export function handleSynthWithdrawal(event: SynthWithdrawalEvent, network: string): void {
  let entity = createUserAction(event, network);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.type = 'withdrawl';
  entity.save();
}
export function handleSynthWithdrawalKovan(event: SynthWithdrawalEvent): void {
  handleSynthWithdrawal(event, 'kovan');
}
export function handleSynthWithdrawalRinkeby(event: SynthWithdrawalEvent): void {
  handleSynthWithdrawal(event, 'rinkeby');
}
export function handleSynthWithdrawalRopsten(event: SynthWithdrawalEvent): void {
  handleSynthWithdrawal(event, 'ropsten');
}

export function handleSynthDeposit(event: SynthDepositEvent, network: string): void {
  let entity = createUserAction(event, network);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.depositIndex = event.params.depositIndex;
  entity.type = 'deposit';
  entity.save();
}
export function handleSynthDepositKovan(event: SynthDepositEvent): void {
  handleSynthDeposit(event, 'kovan');
}
export function handleSynthDepositRinkeby(event: SynthDepositEvent): void {
  handleSynthDeposit(event, 'rinkeby');
}
export function handleSynthDepositRopsten(event: SynthDepositEvent): void {
  handleSynthDeposit(event, 'ropsten');
}

export function handleSynthDepositRemoved(event: SynthDepositRemovedEvent, network: string): void {
  let entity = createUserAction(event, network);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.depositIndex = event.params.depositIndex;
  entity.type = 'removal';
  entity.save();
}
export function handleSynthDepositRemovedKovan(event: SynthDepositRemovedEvent): void {
  handleSynthDepositRemoved(event, 'kovan');
}
export function handleSynthDepositRemovedRinkeby(event: SynthDepositRemovedEvent): void {
  handleSynthDepositRemoved(event, 'rinkeby');
}
export function handleSynthDepositRemovedRopsten(event: SynthDepositRemovedEvent): void {
  handleSynthDepositRemoved(event, 'ropsten');
}

export function handleSynthDepositNotAccepted(event: SynthDepositNotAcceptedEvent, network: string): void {
  let entity = createUserAction(event, network);
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.minimum = event.params.minimum;
  entity.type = 'unaccepted';
  entity.save();
}
export function handleSynthDepositNotAcceptedKovan(event: SynthDepositNotAcceptedEvent): void {
  handleSynthDepositNotAccepted(event, 'kovan');
}
export function handleSynthDepositNotAcceptedRinkeby(event: SynthDepositNotAcceptedEvent): void {
  handleSynthDepositNotAccepted(event, 'rinkeby');
}
export function handleSynthDepositNotAcceptedRopsten(event: SynthDepositNotAcceptedEvent): void {
  handleSynthDepositNotAccepted(event, 'ropsten');
}

export function handleClearedDeposit(event: ClearedDepositEvent, network: string): void {
  let entity = new ClearedDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.fromAddress = event.params.fromAddress;
  entity.toAddress = event.params.toAddress;
  entity.fromETHAmount = event.params.fromETHAmount;
  entity.toAmount = event.params.toAmount;
  entity.depositIndex = event.params.depositIndex;
  entity.network = network;
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.save();
}
export function handleClearedDepositKovan(event: ClearedDepositEvent): void {
  handleClearedDeposit(event, 'kovan');
}
export function handleClearedDepositRinkeby(event: ClearedDepositEvent): void {
  handleClearedDeposit(event, 'rinkeby');
}
export function handleClearedDepositRopsten(event: ClearedDepositEvent): void {
  handleClearedDeposit(event, 'ropsten');
}
