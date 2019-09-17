import {
  Synthetix as SNX,
  SynthExchange as SynthExchangeEvent,
  Transfer as TransferEvent,
} from '../generated/Synthetix/Synthetix';
import { RatesUpdated as RatesUpdatedEvent, ExchangeRates } from '../generated/ExchangeRates/ExchangeRates';
import { TargetUpdated as TargetUpdatedEvent } from '../generated/ProxySynthetix/Proxy';

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
  RateUpdate,
  Issuer,
  Exchanger,
  ProxyTargetUpdated,
  SNXHolder,
} from '../generated/schema';

import { Bytes, ByteArray, BigInt, Address } from '@graphprotocol/graph-ts';

let contracts = new Map<string, string>();
contracts.set('escrow', '0x971e78e0c92392a4e39099835cf7e6ab535b2227');
contracts.set('rewardEscrow', '0xb671f2210b1f6621a2607ea63e6b2dc3e2464d1f');
contracts.set('proxySynthetix', '0xc011a72400e58ecd99ee497cf89e3775d4bd732f');
contracts.set('proxysUSD', '0x57ab1e02fee23774580c119740129eac7081e9d3');

let sUSD = ByteArray.fromHexString('0x73555344') as Bytes;

function getMetadata(): Synthetix {
  let synthetix = Synthetix.load('1');

  if (synthetix == null) {
    synthetix = new Synthetix('1');
    synthetix.issuers = BigInt.fromI32(0);
    synthetix.exchangers = BigInt.fromI32(0);
    synthetix.snxHolders = BigInt.fromI32(0);
    synthetix.exchangeUSDTally = BigInt.fromI32(0);
    synthetix.save();
  }

  return synthetix as Synthetix;
}

function incrementMetadata(field: string): void {
  let metadata = getMetadata();
  if (field == 'issuers') {
    metadata.issuers = metadata.issuers.plus(BigInt.fromI32(1));
  } else if (field == 'exchangers') {
    metadata.exchangers = metadata.exchangers.plus(BigInt.fromI32(1));
  } else if (field == 'snxHolders') {
    metadata.snxHolders = metadata.snxHolders.plus(BigInt.fromI32(1));
  }
  metadata.save();
}

function trackExchanger(account: Address): void {
  let existingExchanger = Exchanger.load(account.toHex());
  if (existingExchanger == null) {
    incrementMetadata('exchangers');
  }
  let exchanger = new Exchanger(account.toHex());
  exchanger.save();
}

function trackIssuer(account: Address, block: BigInt): void {
  let existingIssuer = Issuer.load(account.toHex());
  if (existingIssuer == null) {
    incrementMetadata('issuers');
  }
  let issuer = new Issuer(account.toHex());
  // Note: currently cannot access this as earlier Synthetix deployments did not have debtBalance
  if (block.toI32() > 7000000) {
    let contract = SNX.bind(Address.fromString(contracts.get('proxySynthetix')));
    issuer.debtBalance = contract.debtBalanceOf(account, sUSD); // sUSD
    issuer.collateralisationRatio = contract.collateralisationRatio(account);
  }
  issuer.save();
}

function trackSNXHolder(account: Address, block: BigInt): void {
  let holder = account.toHex();
  // ignore escrow accounts
  if (contracts.get('escrow') == holder || contracts.get('rewardEscrow') == holder) {
    return;
  }
  let existingSNXHolder = SNXHolder.load(account.toHex());
  if (existingSNXHolder == null) {
    incrementMetadata('snxHolders');
  }
  let snxHolder = new SNXHolder(account.toHex());
  // Note: currently cannot access this as earlier Synthetix deployments did not have the "collateral" field
  if (block.toI32() > 7000000) {
    let synthetix = SNX.bind(Address.fromString(contracts.get('proxySynthetix')));
    snxHolder.collateral = synthetix.collateral(account);
  }
  snxHolder.save();
}

// transactions to ignore: these were part of the oracle issue on June 24, 2019 where a bot
// traded on an error with KRW pricing.
let exchangesToIgnore = new Array<string>();
exchangesToIgnore.push('0xfc394ccdc54e4a16f10e41abedf1e9687017d2d92fb910872df7a008441fcdb7');
exchangesToIgnore.push('0x2fecbd27a9ab11f4168e84fe9058696c5654f85291079adb023e5ee49ce9b453');
exchangesToIgnore.push('0x3b22d34d5bf672b4aa8d85c1f560d0b592a57f885bbbd44d55655b480a598e65');
exchangesToIgnore.push('0x3bc868625212fc45baa9d43c8a04763d2d5130c4358bcd76712fd7dfb391f88d');
exchangesToIgnore.push('0x0347037683e6164b7e88a6c5638ee24bf2e0a0cc5512123969ed85542fa51f0f');
exchangesToIgnore.push('0xd68199987b6c457f783a5daeddb4154526003401125ab76cd9b6486be8944174');
exchangesToIgnore.push('0x93819f6bbea390d7709fa033f5733d16418674e99c43b9ed23adb4110d657f0c');
// this final txn was the agreed upon trade back into an artifically lowered synth by the
// bot owner for an ETH bounty.
exchangesToIgnore.push('0xc3fc19c63e1090eb624212bad71a27cd3dc7afcd0cf9063d24bfc47b5d036ae2');

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

  trackExchanger(event.transaction.from);

  // now save the tally of USD value of all exchanges
  if (exchangesToIgnore.indexOf(event.transaction.hash.toHex()) < 0) {
    let metadata = getMetadata();
    let contract = SNX.bind(event.address);
    let toAmount = contract.effectiveValue(event.params.fromCurrencyKey, event.params.fromAmount, sUSD);
    metadata.exchangeUSDTally = metadata.exchangeUSDTally.plus(toAmount);
    metadata.save();
  }
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

  trackSNXHolder(event.params.from, entity.block);
  trackSNXHolder(event.params.to, entity.block);
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

  // required due to assemblyscript
  let keys = entity.currencyKeys;
  let rates = entity.newRates;
  // now save each individual update
  for (let i = 0; i < entity.currencyKeys.length; i++) {
    let rateEntity = new RateUpdate(event.transaction.hash.toHex() + '-' + keys[i].toString());
    rateEntity.block = event.block.number;
    rateEntity.timestamp = event.block.timestamp;
    rateEntity.currencyKey = keys[i];
    rateEntity.synth = keys[i].toString();
    rateEntity.rate = rates[i];
    rateEntity.save();
  }
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

  trackIssuer(event.transaction.from, entity.block);
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
  entity.source = 'Synthetix'; // hardcoded for now
  entity.newTarget = event.params.newTarget;
  entity.block = event.block.number;
  entity.tx = event.transaction.hash;
  entity.save();
}
