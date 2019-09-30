import { Synthetix, SynthExchange as SynthExchangeEvent } from '../generated/Synthetix/Synthetix';
import { Synthetix as SynthetixForXDR4 } from '../generated/SynthXDR4/Synthetix';
import { Synth as SynthXDR4, Issued } from '../generated/SynthXDR4/Synth';
import { Synthetix as SynthetixForXDR32 } from '../generated/SynthXDR32/Synthetix';
import { Synth as SynthXDR32 } from '../generated/SynthXDR32/Synth';

import { Total, SynthExchange, Exchanger } from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

import { exchangesToIgnore } from './exchangesToIgnore';

import { attemptEffectiveValue, sUSD32, sUSD4 } from './common';

function getMetadata(): Total {
  let total = Total.load('1');

  if (total == null) {
    total = new Total('1');
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
  let toAmount = attemptEffectiveValue(synthetix, event.params.fromCurrencyKey, event.params.fromAmount, useBytes32);

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
  entity.amountInUSD = toAmount; // attemptEffectiveValue() can return null but this value can not be
  entity.save();

  trackExchanger(event.transaction.from);

  if (toAmount != null) {
    // now save the tally of USD value of all exchanges
    let metadata = getMetadata();
    metadata.exchangeUSDTally = metadata.exchangeUSDTally.plus(toAmount);
    metadata.save();
  }
}

export function handleSynthExchange4(event: SynthExchangeEvent): void {
  handleSynthExchange(event, false);
}

export function handleSynthExchange32(event: SynthExchangeEvent): void {
  handleSynthExchange(event, true);
}

// Issuing of XDR is our fee mechanism
function handleIssuedXDR(event: Issued, useBytes32: boolean): void {
  if (exchangesToIgnore.indexOf(event.transaction.hash.toHex()) >= 0) {
    return;
  }

  if (useBytes32) {
    let synthXDR = SynthXDR32.bind(event.address);
    let synthetix = SynthetixForXDR32.bind(synthXDR.synthetixProxy());
    let effectiveValueTry = synthetix.try_effectiveValue(synthXDR.currencyKey(), event.params.value, sUSD32);
    if (!effectiveValueTry.reverted) {
      let metadata = getMetadata();
      metadata.totalFeesGeneratedInUSD = metadata.totalFeesGeneratedInUSD.plus(effectiveValueTry.value);
      metadata.save();
    }
  } else {
    // This duping isn't great. We could probably rework it using synthXDR and synthetix as SmartContract and invoke call / tryCall
    let synthXDR = SynthXDR4.bind(event.address);
    let synthetix = SynthetixForXDR4.bind(synthXDR.synthetix());
    let effectiveValueTry = synthetix.try_effectiveValue(synthXDR.currencyKey(), event.params.value, sUSD4);
    if (!effectiveValueTry.reverted) {
      let metadata = getMetadata();
      metadata.totalFeesGeneratedInUSD = metadata.totalFeesGeneratedInUSD.plus(effectiveValueTry.value);
      metadata.save();
    }
  }
}

export function handleIssuedXDR32(event: Issued): void {
  handleIssuedXDR(event, true);
}
export function handleIssuedXDR4(event: Issued): void {
  handleIssuedXDR(event, false);
}
