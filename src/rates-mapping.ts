import { RatesUpdated as RatesUpdatedEvent } from '../generated/ExchangeRates_v223/ExchangeRates';
import { AnswerUpdated as AnswerUpdatedEvent } from '../generated/AggregatorAUD/Aggregator';
import { AddressResolver } from '../generated/AggregatorAUD_3/AddressResolver';
import { ExchangeRates } from '../generated/ExchangeRates/ExchangeRates';

import {
  RatesUpdated,
  RateUpdate,
  AggregatorAnswer,
  FifteenMinuteSNXPrice,
  DailySNXPrice,
  LatestRate,
} from '../generated/schema';

import { contracts } from './contractsData';
import { contractsToProxies } from './contractsToProxies';
import { strToBytes } from './common';

import { ByteArray, Bytes, BigInt, Address, log } from '@graphprotocol/graph-ts';

function loadDailySNXPrice(id: string): DailySNXPrice {
  let newDailySNXPrice = new DailySNXPrice(id);
  newDailySNXPrice.count = BigInt.fromI32(0);
  newDailySNXPrice.averagePrice = BigInt.fromI32(0);
  return newDailySNXPrice;
}

function loadFifteenMinuteSNXPrice(id: string): FifteenMinuteSNXPrice {
  let newFifteenMinuteSNXPrice = new FifteenMinuteSNXPrice(id);
  newFifteenMinuteSNXPrice.count = BigInt.fromI32(0);
  newFifteenMinuteSNXPrice.averagePrice = BigInt.fromI32(0);
  return newFifteenMinuteSNXPrice;
}

function calculateAveragePrice(oldAveragePrice: BigInt, newRate: BigInt, newCount: BigInt): BigInt {
  return oldAveragePrice
    .times(newCount.minus(BigInt.fromI32(1)))
    .plus(newRate)
    .div(newCount);
}

function handleSNXPrices(timestamp: BigInt, rate: BigInt): void {
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

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar('sUSD');
  addDollar('nUSD');

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
    if (keys[i].toString() != '') {
      let rateEntity = new RateUpdate(event.transaction.hash.toHex() + '-' + keys[i].toString());
      rateEntity.block = event.block.number;
      rateEntity.timestamp = event.block.timestamp;
      rateEntity.currencyKey = keys[i];
      rateEntity.synth = keys[i].toString();
      rateEntity.rate = rates[i];
      rateEntity.save();
      if (keys[i].toString() == 'SNX') {
        handleSNXPrices(event.block.timestamp, rateEntity.rate);
      }
      addLatestRate(rateEntity.synth, rateEntity.rate);
    }
  }
}

function createRates(event: AnswerUpdatedEvent, currencyKey: Bytes, rate: BigInt): void {
  let entity = new AggregatorAnswer(event.transaction.hash.toHex() + '-' + currencyKey.toString());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.currencyKey = currencyKey;
  entity.synth = currencyKey.toString();
  entity.rate = rate;
  entity.roundId = event.params.roundId;
  entity.aggregator = event.address;
  entity.save();

  addLatestRate(entity.synth, entity.rate);

  // save aggregated event as rate update from v2.17.5 (Procyon)
  if (event.block.number > BigInt.fromI32(9123410)) {
    let rateEntity = new RateUpdate(event.transaction.hash.toHex() + '-' + entity.synth);
    rateEntity.block = entity.block;
    rateEntity.timestamp = entity.timestamp;
    rateEntity.currencyKey = currencyKey;
    rateEntity.synth = entity.synth;
    rateEntity.rate = entity.rate;
    rateEntity.save();
    if (entity.currencyKey.toString() == 'SNX') {
      handleSNXPrices(entity.timestamp, entity.rate);
    }
  }
}

// create a contract mapping to know which synth the aggregator corresponds to
export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  // From Pollux on, use the ExchangeRates to get the currency keys that use this aggregator
  if (event.block.number > BigInt.fromI32(10773070)) {
    // Note: hard coding the latest ReadProxyAddressResolver address
    let readProxyAdressResolver = '0x4E3b31eB0E5CB73641EE1E65E7dCEFe520bA3ef2';
    let resolver = AddressResolver.bind(Address.fromHexString(readProxyAdressResolver) as Address);
    let exrates = ExchangeRates.bind(resolver.getAddress(strToBytes('ExchangeRates', 32)));

    let tryCurrencyKeys = exrates.try_currenciesUsingAggregator(Address.fromHexString(
      // for the aggregator, we need the proxy
      contractsToProxies.get(event.address.toHexString()),
    ) as Address);

    if (tryCurrencyKeys.reverted) {
      log.debug('currenciesUsingAggregator was reverted in tx hash: {}, from block: {}', [
        event.transaction.hash.toHex(),
        event.block.number.toString(),
      ]);
      return;
    }

    let currencyKeys = tryCurrencyKeys.value;
    // for each currency key using this aggregator
    for (let i = 0; i < currencyKeys.length; i++) {
      // create an answer entity for the non-zero entries
      if (currencyKeys[i].toString() != '') {
        createRates(event, currencyKeys[i], exrates.rateForCurrency(currencyKeys[i]));
      }
    }
  } else {
    // for pre-pollux, use a contract mapping to get the currency key
    let currencyKey = contracts.get(event.address.toHexString());
    // and calculate the rate from Chainlink's Aggregator directly by multiplying by 1e10 to
    // turn the 8 decimal int to a 18 decimal one
    let rate = event.params.current.times(BigInt.fromI32(10).pow(10));
    createRates(event, ByteArray.fromHexString(currencyKey) as Bytes, rate);
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
