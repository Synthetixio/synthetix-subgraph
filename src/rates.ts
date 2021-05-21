import { RatesUpdated as RatesUpdatedEvent } from '../generated/subgraphs/rates/ExchangeRates_13/ExchangeRates';
import { AnswerUpdated as AnswerUpdatedEvent } from '../generated/subgraphs/rates/templates/Aggregator/Aggregator';

import { FifteenMinuteSNXPrice, DailySNXPrice, RateUpdate } from '../generated/subgraphs/rates/schema';

import { addDollar, addLatestRateFromDecimal, calculateInverseRate } from './fragments/latest-rates';

export { handleAggregatorAdded, handleInverseConfigured, handleInverseFrozen } from './fragments/latest-rates';

import { BigDecimal, BigInt, Bytes, dataSource } from '@graphprotocol/graph-ts';
import { toDecimal, ZERO_ADDRESS } from './lib/util';
import { strToBytes } from './lib/helpers';

function loadDailySNXPrice(id: string): DailySNXPrice {
  let newDailySNXPrice = new DailySNXPrice(id);
  newDailySNXPrice.count = BigInt.fromI32(0);
  newDailySNXPrice.averagePrice = toDecimal(BigInt.fromI32(0));
  return newDailySNXPrice;
}

function loadFifteenMinuteSNXPrice(id: string): FifteenMinuteSNXPrice {
  let newFifteenMinuteSNXPrice = new FifteenMinuteSNXPrice(id);
  newFifteenMinuteSNXPrice.count = BigInt.fromI32(0);
  newFifteenMinuteSNXPrice.averagePrice = toDecimal(BigInt.fromI32(0));
  return newFifteenMinuteSNXPrice;
}

function calculateAveragePrice(oldAveragePrice: BigDecimal, newRate: BigDecimal, newCount: BigInt): BigDecimal {
  return oldAveragePrice.plus(newRate.minus(oldAveragePrice).div(toDecimal(newCount, 0)));
}

function handleSNXPrices(timestamp: BigInt, rate: BigDecimal): void {
  let dayID = timestamp.toI32() / 86400;
  let fifteenMinuteID = timestamp.toI32() / 900;

  let dailySNXPrice = DailySNXPrice.load(dayID.toString());
  let fifteenMinuteSNXPrice = FifteenMinuteSNXPrice.load(fifteenMinuteID.toString());

  if (dailySNXPrice == null) {
    dailySNXPrice = loadDailySNXPrice(dayID.toString());
  }

  if (fifteenMinuteSNXPrice == null) {
    fifteenMinuteSNXPrice = loadFifteenMinuteSNXPrice(fifteenMinuteID.toString());
  }

  dailySNXPrice.count = dailySNXPrice.count.plus(BigInt.fromI32(1));
  dailySNXPrice.averagePrice = calculateAveragePrice(dailySNXPrice.averagePrice, rate, dailySNXPrice.count);

  fifteenMinuteSNXPrice.count = fifteenMinuteSNXPrice.count.plus(BigInt.fromI32(1));
  fifteenMinuteSNXPrice.averagePrice = calculateAveragePrice(
    fifteenMinuteSNXPrice.averagePrice,
    rate,
    fifteenMinuteSNXPrice.count,
  );

  dailySNXPrice.save();
  fifteenMinuteSNXPrice.save();
}

function addRateUpdate(currencyKey: Bytes, blockNumber: BigInt, timestamp: BigInt, rate: BigDecimal): void {
  let rateEntity = new RateUpdate(timestamp.toString() + '-' + currencyKey.toString());
  rateEntity.block = blockNumber;
  rateEntity.timestamp = timestamp;
  rateEntity.currencyKey = currencyKey;
  rateEntity.synth = currencyKey.toString();
  rateEntity.rate = rate;
  rateEntity.save();
}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar('sUSD');
  addDollar('nUSD');

  let keys = event.params.currencyKeys;
  let rates = event.params.newRates;

  for (let i = 0; i < keys.length; i++) {
    let decimalRate = toDecimal(rates[i]);

    if (keys[i].toString() == 'SNX') {
      handleSNXPrices(event.block.timestamp, decimalRate);
    }

    if (keys[i].toString() != '') {
      addRateUpdate(keys[i], event.block.number, event.block.timestamp, decimalRate);
      addLatestRateFromDecimal(keys[i].toString(), decimalRate, ZERO_ADDRESS);
    }
  }
}

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = toDecimal(event.params.current.times(BigInt.fromI32(10).pow(10)));

  let currencyKey = context.getString('currencyKey');

  addDollar('sUSD');

  if (currencyKey == 'SNX') {
    handleSNXPrices(event.block.timestamp, rate);
  }

  addRateUpdate(strToBytes(currencyKey), event.block.number, event.block.timestamp, rate);
  addLatestRateFromDecimal(currencyKey, rate, event.address);
}

export function handleInverseAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  let inverseRate = calculateInverseRate(context.getString('currencyKey'), toDecimal(rate));

  if (inverseRate == null) return;

  addRateUpdate(
    strToBytes(context.getString('currencyKey')),
    event.block.number,
    event.block.timestamp,
    inverseRate as BigDecimal,
  );
  addLatestRateFromDecimal(context.getString('currencyKey'), inverseRate as BigDecimal, event.address);
}
