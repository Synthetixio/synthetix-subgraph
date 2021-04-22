import { RatesUpdated as RatesUpdatedEvent } from '../../generated/ExchangeRates/ExchangeRates';

import {
  LatestRate,
} from '../../generated/schema';

import { BigInt } from '@graphprotocol/graph-ts';

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar('sUSD');
  addDollar('nUSD');

  let keys = event.params.currencyKeys;
  let rates = event.params.newRates;
  
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() != '') {
      addLatestRate(keys[i].toString(), rates[i]);
    }
  }
}

function addLatestRate(synth: string, rate: BigInt): void {
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    latestRate = new LatestRate(synth);
  }
  latestRate.rate = rate;
  latestRate.save();
}

function addDollar(dollarID: string): void {
  let dollarRate = LatestRate.load(dollarID);
  if (dollarRate == null) {
    dollarRate = new LatestRate(dollarID);
    let oneDollar = BigInt.fromI32(10);
    dollarRate.rate = oneDollar.pow(18);
    dollarRate.save();
  }
}