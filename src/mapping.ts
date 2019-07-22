import {
  SynthExchange as SynthExchangeEvent,
  Transfer as TransferEvent,
  Approval as ApprovalEvent,
  TokenStateUpdated as TokenStateUpdatedEvent,
  ProxyUpdated as ProxyUpdatedEvent,
  SelfDestructTerminated as SelfDestructTerminatedEvent,
  SelfDestructed as SelfDestructedEvent,
  SelfDestructInitiated as SelfDestructInitiatedEvent,
  SelfDestructBeneficiaryUpdated as SelfDestructBeneficiaryUpdatedEvent,
  OwnerNominated as OwnerNominatedEvent,
  OwnerChanged as OwnerChangedEvent,
} from '../generated/Synthetix/Synthetix';
import { RatesUpdated as RatesUpdatedEvent } from '../generated/ExchangeRates/ExchangeRates';

import {
  Synth,
  Transfer as SynthTransferEvent,
  Issued as IssuedEvent,
  Burned as BurnedEvent,
} from '../generated/SynthsUSD/Synth';
import {
  SynthExchange,
  Transfer,
  Issued,
  Burned,
  RatesUpdated,
  Approval,
  TokenStateUpdated,
  ProxyUpdated,
  SelfDestructTerminated,
  SelfDestructed,
  SelfDestructInitiated,
  SelfDestructBeneficiaryUpdated,
  OwnerNominated,
  OwnerChanged,
  Issuer,
} from '../generated/schema';

export function handleSynthExchange(event: SynthExchangeEvent): void {
  let entity = new SynthExchange(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.from = event.transaction.from;
  entity.fromCurrencyKey = event.params.fromCurrencyKey;
  entity.fromAmount = event.params.fromAmount;
  entity.toCurrencyKey = event.params.toCurrencyKey;
  entity.toAmount = event.params.toAmount;
  entity.toAddress = event.params.toAddress;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();
}

export function handleTransferSNX(event: TransferEvent): void {
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'SNX';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();
}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  let entity = new RatesUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.currencyKeys = event.params.currencyKeys;
  entity.newRates = event.params.newRates;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.from = event.transaction.from;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  let contract = Synth.bind(event.address);
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = contract.currencyKey().toString();
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();
}

export function handleTransfersUSD(event: SynthTransferEvent): void {
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  // sUSD contract didn't have the "currencyKey" field prior to the multicurrency release, so
  // we hardcode this as The Graph doesn't yet support handling errors in calls.
  // See https://github.com/graphprotocol/support/issues/21#issuecomment-507652767
  entity.source = 'sUSD';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();
}

export function handleIssuedsUSD(event: IssuedEvent): void {
  let entity = new Issued(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.value = event.params.value;
  entity.source = 'sUSD';
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();

  // now track individual issuers
  let issuer = new Issuer(event.transaction.from.toHex());
  issuer.save();
}

export function handleBurnedsUSD(event: BurnedEvent): void {
  let entity = new Burned(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.value = event.params.value;
  entity.source = 'sUSD';
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.owner = event.params.owner;
  entity.spender = event.params.spender;
  entity.value = event.params.value;
  entity.save();
}

export function handleTokenStateUpdated(event: TokenStateUpdatedEvent): void {
  let entity = new TokenStateUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.newTokenState = event.params.newTokenState;
  entity.save();
}

export function handleProxyUpdated(event: ProxyUpdatedEvent): void {
  let entity = new ProxyUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.proxyAddress = event.params.proxyAddress;
  entity.save();
}

export function handleSelfDestructTerminated(event: SelfDestructTerminatedEvent): void {
  let entity = new SelfDestructTerminated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.save();
}

export function handleSelfDestructed(event: SelfDestructedEvent): void {
  let entity = new SelfDestructed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.beneficiary = event.params.beneficiary;
  entity.save();
}

export function handleSelfDestructInitiated(event: SelfDestructInitiatedEvent): void {
  let entity = new SelfDestructInitiated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.selfDestructDelay = event.params.selfDestructDelay;
  entity.save();
}

export function handleSelfDestructBeneficiaryUpdated(event: SelfDestructBeneficiaryUpdatedEvent): void {
  let entity = new SelfDestructBeneficiaryUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.newBeneficiary = event.params.newBeneficiary;
  entity.save();
}

export function handleOwnerNominated(event: OwnerNominatedEvent): void {
  let entity = new OwnerNominated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.newOwner = event.params.newOwner;
  entity.save();
}

export function handleOwnerChanged(event: OwnerChangedEvent): void {
  let entity = new OwnerChanged(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.oldOwner = event.params.oldOwner;
  entity.newOwner = event.params.newOwner;
  entity.save();
}
