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
  FifteenMinuteTotal,
  SynthExchange,
  Exchanger,
  DailyExchanger,
  FifteenMinuteExchanger,
  ExchangeReclaim,
  ExchangeRebate
} from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

import { exchangesToIgnore } from './exchangesToIgnore';

import { sUSD32, sUSD4, strToBytes } from './common';

let v219 = BigInt.fromI32(9518914); // Archernar v2.19.x Feb 20, 2020

let exchangeRatesAsBytes = strToBytes('ExchangeRates', 32);

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
  
  let account = event.transaction.from
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

  let timestamp = event.block.timestamp.toI32()

  let dayID = timestamp / 86400
  let fifteenMinuteID = timestamp / 900

  let total = Total.load('mainnet');
  let dailyTotal = DailyTotal.load(dayID.toString());
  let fifteenMinuteTotal = FifteenMinuteTotal.load(fifteenMinuteID.toString());

  if (total == null) {
    total = new Total('mainnet');
    total.exchangers = BigInt.fromI32(0);
    total.exchangeUSDTally = BigInt.fromI32(0);
    total.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  }

  if (dailyTotal == null) {
    dailyTotal = new DailyTotal(dayID.toString());
    dailyTotal.exchangers = BigInt.fromI32(0);
    dailyTotal.exchangeUSDTally = BigInt.fromI32(0);
    dailyTotal.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  }

  if (fifteenMinuteTotal == null) {
    fifteenMinuteTotal = new FifteenMinuteTotal(fifteenMinuteID.toString());
    fifteenMinuteTotal.exchangers = BigInt.fromI32(0);
    fifteenMinuteTotal.exchangeUSDTally = BigInt.fromI32(0);
    fifteenMinuteTotal.totalFeesGeneratedInUSD = BigInt.fromI32(0);
  }

  let existingExchanger = Exchanger.load(account.toHex());
  let existingDailyExchanger = DailyExchanger.load(account.toHex());
  let existingFifteenMinuteExchanger = FifteenMinuteExchanger.load(account.toHex());

  if (existingExchanger == null) {
    total.exchangers = total.exchangers.plus(BigInt.fromI32(1));
    let exchanger = new Exchanger(account.toHex());
    exchanger.save();
  }

  if (existingDailyExchanger == null) {
    dailyTotal.exchangers = dailyTotal.exchangers.plus(BigInt.fromI32(1));
    let dailyExchanger = new DailyExchanger(account.toHex());
    dailyExchanger.save();
  }

  if (existingFifteenMinuteExchanger == null) {
    fifteenMinuteTotal.exchangers = fifteenMinuteTotal.exchangers.plus(BigInt.fromI32(1));
    let fifteenMinuteExchanger = new FifteenMinuteExchanger(account.toHex());
    fifteenMinuteExchanger.save();
  }

  total.exchangers = total.exchangers.plus(BigInt.fromI32(1));
  dailyTotal.exchangers = dailyTotal.exchangers.plus(BigInt.fromI32(1));
  fifteenMinuteTotal.exchangers = fifteenMinuteTotal.exchangers.plus(BigInt.fromI32(1));

  if (fromAmountInUSD != null && feesInUSD != null) {
    total.exchangeUSDTally = total.exchangeUSDTally.plus(fromAmountInUSD);
    total.totalFeesGeneratedInUSD = total.totalFeesGeneratedInUSD.plus(feesInUSD);
    dailyTotal.exchangeUSDTally = dailyTotal.exchangeUSDTally.plus(fromAmountInUSD);
    dailyTotal.totalFeesGeneratedInUSD = dailyTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
    fifteenMinuteTotal.exchangeUSDTally = fifteenMinuteTotal.exchangeUSDTally.plus(fromAmountInUSD);
    fifteenMinuteTotal.totalFeesGeneratedInUSD = fifteenMinuteTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
  }
  total.save();
  dailyTotal.save();
  fifteenMinuteTotal.save();
}

export function handleSynthExchange4(event: SynthExchangeEvent): void {
  handleSynthExchange(event, false);
}

export function handleSynthExchange32(event: SynthExchangeEvent): void {
  handleSynthExchange(event, true);
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
