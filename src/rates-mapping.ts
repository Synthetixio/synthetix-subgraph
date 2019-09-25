import { RatesUpdated as RatesUpdatedEvent } from '../generated/ExchangeRates/ExchangeRates';

import { RatesUpdated, RateUpdate } from '../generated/schema';

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
