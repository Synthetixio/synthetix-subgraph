import { Synthetix, SynthExchange as SynthExchangeEvent } from '../generated/Synthetix/Synthetix';
import { Total, SynthExchange, Exchanger } from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

import { exchangesToIgnore } from './exchangesToIgnore';

import { attemptEffectiveValue } from './common';

function getMetadata(): Total {
  let total = Total.load('mainnet');

  if (total == null) {
    total = new Total('mainnet');
    total.exchangers = BigInt.fromI32(0);
    total.exchangeUSDTally = BigInt.fromI32(0);
    total.totalFeesGeneratedInUSD = BigInt.fromI32(0);
    total.save();
  }

  return total as Total;
}

function incrementMetadata(field: string): void {
  let metadata = getMetadata();
  if (field == 'exchangers') {
    metadata.exchangers = metadata.exchangers.plus(BigInt.fromI32(1));
  }
  metadata.save();
}

function trackExchanger(account: Address): void {
  let existingExchanger = Exchanger.load(account.toHex());
  if (existingExchanger == null) {
    incrementMetadata('exchangers');
    let exchanger = new Exchanger(account.toHex());
    exchanger.save();
  }
}

function handleSynthExchange(event: SynthExchangeEvent, useBytes32: boolean): void {
  if (exchangesToIgnore.indexOf(event.transaction.hash.toHex()) >= 0) {
    return;
  }

  let synthetix = Synthetix.bind(event.address);
  let fromAmountInUSD = attemptEffectiveValue(
    synthetix,
    event.params.fromCurrencyKey,
    event.params.fromAmount,
    useBytes32,
  );
  let toAmountInUSD = attemptEffectiveValue(synthetix, event.params.toCurrencyKey, event.params.toAmount, useBytes32);
  let feesInUSD = fromAmountInUSD.minus(toAmountInUSD);

  let entity = new SynthExchange(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.from = event.transaction.from;
  entity.fromCurrencyKey = event.params.fromCurrencyKey;
  entity.fromAmount = event.params.fromAmount;
  entity.fromAmountInUSD = fromAmountInUSD;
  entity.toCurrencyKey = event.params.toCurrencyKey;
  entity.toAmount = event.params.toAmount;
  entity.toAmountInUSD = toAmountInUSD;
  entity.toAddress = event.params.toAddress;
  entity.feesInUSD = feesInUSD;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.network = 'mainnet';
  entity.save();

  trackExchanger(event.transaction.from);

  if (fromAmountInUSD != null && feesInUSD != null) {
    // now save the tally of USD value of all exchanges
    let metadata = getMetadata();
    metadata.exchangeUSDTally = metadata.exchangeUSDTally.plus(fromAmountInUSD);
    metadata.totalFeesGeneratedInUSD = metadata.totalFeesGeneratedInUSD.plus(feesInUSD);
    metadata.save();
  }
}

export function handleSynthExchange4(event: SynthExchangeEvent): void {
  handleSynthExchange(event, false);
}

export function handleSynthExchange32(event: SynthExchangeEvent): void {
  handleSynthExchange(event, true);
}
