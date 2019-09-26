import { Synthetix as SNX, SynthExchange as SynthExchangeEvent } from '../generated/Synthetix/Synthetix';
import { Total, SynthExchange, Exchanger } from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

import { exchangesToIgnore } from './exchangesToIgnore';

import { attemptEffectiveValue } from './common';

function getMetadata(): Total {
  let synthetix = Total.load('1');

  if (synthetix == null) {
    synthetix = new Total('1');
    synthetix.exchangers = BigInt.fromI32(0);
    synthetix.exchangeUSDTally = BigInt.fromI32(0);
    synthetix.save();
  }

  return synthetix as Total;
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
    let toAmount = attemptEffectiveValue(contract, event.params.fromCurrencyKey, event.params.fromAmount, useBytes32);

    if (toAmount != null) {
      metadata.exchangeUSDTally = metadata.exchangeUSDTally.plus(toAmount);
      metadata.save();
    }
  }
}

export function handleSynthExchange4(event: SynthExchangeEvent): void {
  handleSynthExchange(event, false);
}

export function handleSynthExchange32(event: SynthExchangeEvent): void {
  handleSynthExchange(event, true);
}
