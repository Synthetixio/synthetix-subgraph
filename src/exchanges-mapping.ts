import {
  Synthetix,
  SynthExchange as SynthExchangeEvent,
  ExchangeReclaim as ExchangeReclaimEvent,
  ExchangeRebate as ExchangeRebateEvent,
} from '../generated/Synthetix/Synthetix';
import { AddressResolver } from '../generated/Synthetix/AddressResolver';
import { ExchangeRates } from '../generated/Synthetix/ExchangeRates';
import { Synthetix32 } from '../generated/Synthetix/Synthetix32';
import { Synthetix4 } from '../generated/Synthetix/Synthetix4';

import {
  Total,
  DailyTotal,
  DailySynthTotal,
  FifteenMinuteTotal,
  FifteenMinuteSynthTotal,
  SynthExchange,
  Exchanger,
  DailyExchanger,
  FifteenMinuteExchanger,
  ExchangeReclaim,
  ExchangeRebate,
  PostArchernarTotal,
  PostArchernarSynthTotal,
  PostArchernarExchanger,
} from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

import { exchangesToIgnore } from './exchangesToIgnore';

import { sUSD32, sUSD4, strToBytes } from './common';

let v219 = BigInt.fromI32(9518914); // Archernar v2.19.x Feb 20, 2020

let exchangeRatesAsBytes = strToBytes('ExchangeRates', 32);

interface AggregatedTotalEntity {
  trades: BigInt
  exchangers: BigInt
  exchangeUSDTally: BigInt
  totalFeesGeneratedInUSD: BigInt
  save: () => void
}

function getExchangeRates(address: Address): ExchangeRates {
  let synthetix = Synthetix.bind(address);

  let resolverTry = synthetix.try_resolver();

  if (!resolverTry.reverted) {
    let resolver = AddressResolver.bind(resolverTry.value);
    let exRatesAddressTry = resolver.try_getAddress(exchangeRatesAsBytes);

    if (!exRatesAddressTry.reverted) {
      return ExchangeRates.bind(exRatesAddressTry.value);
    }
  }

  return null;
}

function handleSynthExchange(event: SynthExchangeEvent, useBytes32: boolean): void {
  if (exchangesToIgnore.indexOf(event.transaction.hash.toHex()) >= 0) {
    return;
  }

  let account = event.transaction.from;
  let fromAmountInUSD = BigInt.fromI32(0);
  let toAmountInUSD = BigInt.fromI32(0);
  let feesInUSD = BigInt.fromI32(0);

  if (event.block.number > v219) {
    let exRates = getExchangeRates(event.address);

    if (exRates != null) {
      let effectiveValueTryFrom = exRates.try_effectiveValue(
        event.params.fromCurrencyKey,
        event.params.fromAmount,
        sUSD32,
      );

      if (!effectiveValueTryFrom.reverted) {
        fromAmountInUSD = effectiveValueTryFrom.value;
      }

      let effectiveValueTryTo = exRates.try_effectiveValue(event.params.toCurrencyKey, event.params.toAmount, sUSD32);

      if (!effectiveValueTryTo.reverted) {
        toAmountInUSD = effectiveValueTryTo.value;
      }
    }
  } else {
    if (useBytes32) {
      let synthetix = Synthetix32.bind(event.address);

      let effectiveValueTry = synthetix.try_effectiveValue(
        event.params.fromCurrencyKey,
        event.params.fromAmount,
        sUSD32,
      );
      if (!effectiveValueTry.reverted) {
        fromAmountInUSD = effectiveValueTry.value;
        toAmountInUSD = synthetix.effectiveValue(event.params.toCurrencyKey, event.params.toAmount, sUSD32);
      }
    } else {
      let synthetix = Synthetix4.bind(event.address);

      let effectiveValueTry = synthetix.try_effectiveValue(
        event.params.fromCurrencyKey,
        event.params.fromAmount,
        sUSD4,
      );
      if (!effectiveValueTry.reverted) {
        fromAmountInUSD = effectiveValueTry.value;
        toAmountInUSD = synthetix.effectiveValue(event.params.toCurrencyKey, event.params.toAmount, sUSD4);
      }
    }
  }
  feesInUSD = fromAmountInUSD.minus(toAmountInUSD);

  let entity = new SynthExchange(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.from = account;
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

  let timestamp = event.block.timestamp.toI32();

  let dayID = timestamp / 86400;
  let fifteenMinuteID = timestamp / 900;

  let fromCurrencyKey = event.params.fromCurrencyKey.toString();
  let toCurrencyKey = event.params.toCurrencyKey.toString();

  if (v219 < event.block.number) {
    let postArchernarTotal = PostArchernarTotal.load('mainnet') || populateAggregatedTotalEntity(new PostArchernarTotal('mainnet'));
    let synthFromPostArchernarTotal = PostArchernarSynthTotal.load(fromCurrencyKey) || populateAggregatedTotalEntity(new PostArchernarSynthTotal(fromCurrencyKey));
    let synthToPostArchernarTotal = PostArchernarSynthTotal.load(toCurrencyKey) || populateAggregatedTotalEntity(new PostArchernarSynthTotal(toCurrencyKey));

    synthFromPostArchernarTotal.currencyKey = event.params.fromCurrencyKey;
    synthToPostArchernarTotal.currencyKey = event.params.toCurrencyKey;

    let existingPostArchernarExchanger = PostArchernarExchanger.load(account.toHex());
    
    if (existingPostArchernarExchanger == null && v219 < event.block.number) {
      let postArchernarExchanger = new PostArchernarExchanger(account.toHex());
      postArchernarExchanger.save();
    }

    trackTotals(postArchernarTotal, !!existingPostArchernarExchanger, fromAmountInUSD, feesInUSD);
    trackTotals(synthToPostArchernarTotal, !!existingPostArchernarExchanger, fromAmountInUSD, feesInUSD);
    trackTotals(synthFromPostArchernarTotal, !!existingPostArchernarExchanger, fromAmountInUSD, feesInUSD);
  }

  let total = Total.load('mainnet') || new Total('mainnet');
  let dailyTotal = DailyTotal.load(dayID.toString()) || populateAggregatedTotalEntity(new DailyTotal(dayID.toString()));
  let fifteenMinuteTotal = FifteenMinuteTotal.load(fifteenMinuteID.toString()) || populateAggregatedTotalEntity(new FifteenMinuteTotal(fifteenMinuteID.toString()));

  let synthFromDailyTotal = DailySynthTotal.load(fromCurrencyKey + '-' + dayID.toString()) || populateAggregatedTotalEntity(new DailySynthTotal(fromCurrencyKey + '-' + dayID.toString()));
  let synthToDailyTotal = DailySynthTotal.load(toCurrencyKey + '-' + dayID.toString()) || populateAggregatedTotalEntity(new DailySynthTotal(toCurrencyKey + '-' + dayID.toString()));
  let synthFromFifteenMinuteTotal = FifteenMinuteSynthTotal.load(fromCurrencyKey + '-' + fifteenMinuteID.toString()) || populateAggregatedTotalEntity(new FifteenMinuteSynthTotal(fromCurrencyKey + '-' + fifteenMinuteID.toString()));
  let synthToFifteenMinuteTotal = FifteenMinuteSynthTotal.load(toCurrencyKey + '-' + fifteenMinuteID.toString()) || populateAggregatedTotalEntity(new FifteenMinuteSynthTotal(toCurrencyKey + '-' + fifteenMinuteID.toString()));
  
  synthFromDailyTotal.currencyKey = event.params.fromCurrencyKey;
  synthFromDailyTotal.dayID = dayID.toString();

  synthToDailyTotal.currencyKey = event.params.toCurrencyKey;
  synthToDailyTotal.dayID = dayID.toString();
  
  synthFromFifteenMinuteTotal.currencyKey = event.params.fromCurrencyKey;
  synthFromFifteenMinuteTotal.timeID = fifteenMinuteID.toString();
  
  synthToFifteenMinuteTotal.currencyKey = event.params.toCurrencyKey;
  synthToFifteenMinuteTotal.timeID = fifteenMinuteID.toString();

  let existingExchanger = Exchanger.load(account.toHex());
  let existingDailyExchanger = DailyExchanger.load(dayID.toString() + '-' + account.toHex());
  let existingFifteenMinuteExchanger = FifteenMinuteExchanger.load(fifteenMinuteID.toString() + '-' + account.toHex());

  if (existingExchanger == null) {
    let exchanger = new Exchanger(account.toHex());
    exchanger.save();
  }

  if (existingDailyExchanger == null) {
    let dailyExchanger = new DailyExchanger(dayID.toString() + '-' + account.toHex());
    dailyExchanger.save();
  }

  if (existingFifteenMinuteExchanger == null) {
    let fifteenMinuteExchanger = new FifteenMinuteExchanger(fifteenMinuteID.toString() + '-' + account.toHex());
    fifteenMinuteExchanger.save();
  }

  trackTotals(total, !!existingExchanger, fromAmountInUSD, feesInUSD);

  trackTotals(dailyTotal, !!existingDailyExchanger, fromAmountInUSD, feesInUSD);
  trackTotals(synthToDailyTotal, !!existingDailyExchanger, fromAmountInUSD, feesInUSD);
  trackTotals(synthFromDailyTotal, !!existingDailyExchanger, fromAmountInUSD, feesInUSD);

  trackTotals(fifteenMinuteTotal, !!existingFifteenMinuteExchanger, fromAmountInUSD, feesInUSD);
  trackTotals(synthToFifteenMinuteTotal, !!existingFifteenMinuteExchanger, fromAmountInUSD, feesInUSD);
  trackTotals(synthFromFifteenMinuteTotal, !!existingFifteenMinuteExchanger, fromAmountInUSD, feesInUSD);

}

export function handleSynthExchange4(event: SynthExchangeEvent): void {
  handleSynthExchange(event, false);
}

export function handleSynthExchange32(event: SynthExchangeEvent): void {
  handleSynthExchange(event, true);
}

function populateAggregatedTotalEntity<T extends AggregatedTotalEntity>(entity: T): T {
  entity.trades = BigInt.fromI32(0);
  entity.exchangers = BigInt.fromI32(0);
  entity.exchangeUSDTally = BigInt.fromI32(0);
  entity.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  return entity;
}

function trackTotals<T extends AggregatedTotalEntity>(entity: T, existingExchanger: boolean, amountInUSD: BigInt, feesInUSD: BigInt): void {

  entity.trades = entity.trades.plus(BigInt.fromI32(1));

  if(!existingExchanger)
    entity.exchangers = entity.exchangers.plus(BigInt.fromI32(1));

  entity.exchangeUSDTally = entity.exchangeUSDTally.plus(amountInUSD);
  entity.totalFeesGeneratedInUSD = entity.totalFeesGeneratedInUSD.plus(feesInUSD);
  entity.save();
}

export function handleExchangeReclaim(event: ExchangeReclaimEvent): void {
  let entity = new ExchangeReclaim(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.amount = event.params.amount;
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  let exRates = getExchangeRates(event.address);
  if (exRates != null) {
    entity.amountInUSD = exRates.effectiveValue(event.params.currencyKey, event.params.amount, sUSD32);
  }
  entity.save();
}

export function handleExchangeRebate(event: ExchangeRebateEvent): void {
  let entity = new ExchangeRebate(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.amount = event.params.amount;
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  let exRates = getExchangeRates(event.address);
  if (exRates != null) {
    entity.amountInUSD = exRates.effectiveValue(event.params.currencyKey, event.params.amount, sUSD32);
  }
  entity.save();
}

function loadTotal(): Total {
  let newTotal = new Total('mainnet');
  newTotal.trades = BigInt.fromI32(0);
  newTotal.exchangers = BigInt.fromI32(0);
  newTotal.exchangeUSDTally = BigInt.fromI32(0);
  newTotal.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  return newTotal;
}

function loadPostArchernarTotal(): PostArchernarTotal {
  let newPostArchernarTotal = new PostArchernarTotal('mainnet');
  newPostArchernarTotal.trades = BigInt.fromI32(0);
  newPostArchernarTotal.exchangers = BigInt.fromI32(0);
  newPostArchernarTotal.exchangeUSDTally = BigInt.fromI32(0);
  newPostArchernarTotal.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  return newPostArchernarTotal;
}

function loadDailyTotal(id: string): DailyTotal {
  let newDailyTotal = new DailyTotal(id);
  newDailyTotal.trades = BigInt.fromI32(0);
  newDailyTotal.exchangers = BigInt.fromI32(0);
  newDailyTotal.exchangeUSDTally = BigInt.fromI32(0);
  newDailyTotal.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  return newDailyTotal;
}

function loadFifteenMinuteTotal(id: string): FifteenMinuteTotal {
  let newFifteenMinuteTotal = new FifteenMinuteTotal(id);
  newFifteenMinuteTotal.trades = BigInt.fromI32(0);
  newFifteenMinuteTotal.exchangers = BigInt.fromI32(0);
  newFifteenMinuteTotal.exchangeUSDTally = BigInt.fromI32(0);
  newFifteenMinuteTotal.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  return newFifteenMinuteTotal;
}

function addPostArchernarTotalFeesAndVolume(
  postArchernarTotal: PostArchernarTotal,
  fromAmountInUSD: BigInt,
  feesInUSD: BigInt,
): PostArchernarTotal {
  postArchernarTotal.exchangeUSDTally = postArchernarTotal.exchangeUSDTally.plus(fromAmountInUSD);
  postArchernarTotal.totalFeesGeneratedInUSD = postArchernarTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
  return postArchernarTotal;
}

function addTotalFeesAndVolume(total: Total, fromAmountInUSD: BigInt, feesInUSD: BigInt): Total {
  total.exchangeUSDTally = total.exchangeUSDTally.plus(fromAmountInUSD);
  total.totalFeesGeneratedInUSD = total.totalFeesGeneratedInUSD.plus(feesInUSD);
  return total;
}

function addDailyTotalFeesAndVolume(dailyTotal: DailyTotal, fromAmountInUSD: BigInt, feesInUSD: BigInt): DailyTotal {
  dailyTotal.exchangeUSDTally = dailyTotal.exchangeUSDTally.plus(fromAmountInUSD);
  dailyTotal.totalFeesGeneratedInUSD = dailyTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
  return dailyTotal;
}

function addFifteenMinuteTotalFeesAndVolume(
  fifteenMinuteTotal: FifteenMinuteTotal,
  fromAmountInUSD: BigInt,
  feesInUSD: BigInt,
): FifteenMinuteTotal {
  fifteenMinuteTotal.exchangeUSDTally = fifteenMinuteTotal.exchangeUSDTally.plus(fromAmountInUSD);
  fifteenMinuteTotal.totalFeesGeneratedInUSD = fifteenMinuteTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
  return fifteenMinuteTotal;
}
