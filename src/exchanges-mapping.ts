import {
  Synthetix,
  SynthExchange as SynthExchangeEvent,
  ExchangeReclaim as ExchangeReclaimEvent,
  ExchangeRebate as ExchangeRebateEvent,
} from '../generated/Synthetix/Synthetix';
import { AddressResolver } from '../generated/Synthetix/AddressResolver';
import { ExchangeRates } from '../generated/Synthetix/ExchangeRates';
import { Synthetix32 } from '../generated/Synthetix/Synthetix32';
import { Synthetix as Synthetix4 } from '../generated/Synthetix4/Synthetix';

import { Total, SynthExchange, Exchanger, ExchangeReclaim, ExchangeRebate } from '../generated/schema';

import { BigInt, Address, Bytes, ByteArray } from '@graphprotocol/graph-ts';

import { exchangesToIgnore } from './exchangesToIgnore';

import { sUSD32, sUSD4 } from './common';

let v219 = BigInt.fromI32(9518914); // Archernar v2.19.x Feb 20, 2020

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

let exchangeRatesAsBytes = ByteArray.fromHexString(
  '0x45786368616e6765526174657300000000000000000000000000000000000000',
) as Bytes;

function handleSynthExchange(event: SynthExchangeEvent, useBytes32: boolean): void {
  if (exchangesToIgnore.indexOf(event.transaction.hash.toHex()) >= 0) {
    return;
  }

  let fromAmountInUSD = BigInt.fromI32(0);
  let toAmountInUSD = BigInt.fromI32(0);
  let feesInUSD = BigInt.fromI32(0);

  if (event.block.number > v219) {
    let synthetix = Synthetix.bind(event.address);

    let resolverTry = synthetix.try_resolver();

    if (!resolverTry.reverted) {
      let resolver = AddressResolver.bind(resolverTry.value);
      let exRatesAddressTry = resolver.try_getAddress(exchangeRatesAsBytes);

      if (!exRatesAddressTry.reverted) {
        let exRates = ExchangeRates.bind(exRatesAddressTry.value);

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

export function handleExchangeReclaim(event: ExchangeReclaimEvent): void {
  let entity = new ExchangeReclaim(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.amount = event.params.amount;
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
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
  entity.save();
}
