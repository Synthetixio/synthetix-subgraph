import { SynthExchange as SynthExchangeEvent, Transfer as TransferEvent } from '../generated/Synthetix/Synthetix';
import { RatesUpdated as RatesUpdatedEvent } from '../generated/ExchangeRates/ExchangeRates';
import { Proxy, TargetUpdated as TargetUpdatedEvent } from '../generated/ProxySynthetix/Proxy';

import {
  Synth,
  Transfer as SynthTransferEvent,
  Issued as IssuedEvent,
  Burned as BurnedEvent,
} from '../generated/SynthsUSD/Synth';
import {
  Synthetix,
  SynthExchange,
  Transfer,
  Issued,
  Burned,
  RatesUpdated,
  Issuer,
  ProxyTargetUpdated,
} from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

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

function trackIssuer(account: Address): void {
  let existingIssuer = Issuer.load(account.toHex());
  // If this is a new issuer, track it in the metadata
  if (existingIssuer == null) {
    // update metadata
    let metadata = Synthetix.load('1');
    if (metadata != null) {
      metadata.issuers = metadata.issuers.plus(BigInt.fromI32(1));
    } else {
      metadata = new Synthetix('1');
      metadata.issuers = BigInt.fromI32(1);
    }
    metadata.save();
  }
  let issuer = new Issuer(account.toHex());
  issuer.save();
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

  trackIssuer(event.transaction.from);
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

export function handleProxyTargetUpdated(event: TargetUpdatedEvent): void {
  let entity = new ProxyTargetUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'SNX'; // hardcoded for now
  let contract = Proxy.bind(event.address);
  entity.oldTarget = contract.target();
  entity.newTarget = event.params.newTarget;
  entity.save();
}
