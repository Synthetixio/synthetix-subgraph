import {
  Synthetix,
  SynthExchange as SynthExchangeEvent,
  ExchangeReclaim as ExchangeReclaimEvent,
  ExchangeRebate as ExchangeRebateEvent,
} from '../generated/Synthetix/Synthetix';
import { AddressResolver } from '../generated/Synthetix/AddressResolver';
import { Exchanger as ExchangerContract } from '../generated/Exchanger_v7/Exchanger';

import {
  Total,
  DailyTotal,
  FifteenMinuteTotal,
  SynthExchange,
  Exchanger,
  DailyExchanger,
  FifteenMinuteExchanger,
  ExchangeReclaim,
  ExchangeRebate,
} from '../generated/schema';

import { BigDecimal, BigInt, Address, log } from '@graphprotocol/graph-ts';

import { strToBytes, getUSDAmountFromAssetAmount, etherUnits, getLatestRate } from './helpers';

let exchangerAsBytes = strToBytes('Exchanger', 32);

function getExchanger(address: Address): ExchangerContract {
  let synthetix = Synthetix.bind(address);

  let resolverTry = synthetix.try_resolver();

  if (!resolverTry.reverted) {
    let resolver = AddressResolver.bind(resolverTry.value);
    let exchangerAddressTry = resolver.try_getAddress(exchangerAsBytes);

    if (!exchangerAddressTry.reverted) {
      return ExchangerContract.bind(exchangerAddressTry.value);
    }
  }

  return null;
}

export function handleSynthExchange(event: SynthExchangeEvent): void {
  let txHash = event.transaction.hash.toHex();
  let latestRate = getLatestRate(event.params.fromCurrencyKey.toString(), txHash);
  let exchanger = getExchanger(event.address);

  if (exchanger == null || latestRate == null) {
    log.error('handleSynthExchange has an issue in tx hash: {}', [txHash]);
    return;
  }

  let account = event.transaction.from;
  let fromAmountInUSD = getUSDAmountFromAssetAmount(event.params.toAmount, latestRate);

  let feeRateForExchange = exchanger.feeRateForExchange(event.params.fromCurrencyKey, event.params.toCurrencyKey);
  let feeRateForExchangeBD = new BigDecimal(feeRateForExchange);
  let feesInUSD = fromAmountInUSD.times(feeRateForExchangeBD.div(etherUnits));
  let toAmountInUSD = fromAmountInUSD.minus(feesInUSD);

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

  let total = Total.load('mainnet');
  let dailyTotal = DailyTotal.load(dayID.toString());
  let fifteenMinuteTotal = FifteenMinuteTotal.load(fifteenMinuteID.toString());

  if (total == null) {
    total = loadTotal();
  }

  if (dailyTotal == null) {
    dailyTotal = loadDailyTotal(dayID.toString());
  }

  if (fifteenMinuteTotal == null) {
    fifteenMinuteTotal = loadFifteenMinuteTotal(fifteenMinuteID.toString());
  }

  let existingExchanger = Exchanger.load(account.toHex());
  let existingDailyExchanger = DailyExchanger.load(dayID.toString() + '-' + account.toHex());
  let existingFifteenMinuteExchanger = FifteenMinuteExchanger.load(fifteenMinuteID.toString() + '-' + account.toHex());

  if (existingExchanger == null) {
    total.exchangers = total.exchangers.plus(BigInt.fromI32(1));
    let exchanger = new Exchanger(account.toHex());
    exchanger.save();
  }

  if (existingDailyExchanger == null) {
    dailyTotal.exchangers = dailyTotal.exchangers.plus(BigInt.fromI32(1));
    let dailyExchanger = new DailyExchanger(dayID.toString() + '-' + account.toHex());
    dailyExchanger.save();
  }

  if (existingFifteenMinuteExchanger == null) {
    fifteenMinuteTotal.exchangers = fifteenMinuteTotal.exchangers.plus(BigInt.fromI32(1));
    let fifteenMinuteExchanger = new FifteenMinuteExchanger(fifteenMinuteID.toString() + '-' + account.toHex());
    fifteenMinuteExchanger.save();
  }

  total.trades = total.trades.plus(BigInt.fromI32(1));
  dailyTotal.trades = dailyTotal.trades.plus(BigInt.fromI32(1));
  fifteenMinuteTotal.trades = fifteenMinuteTotal.trades.plus(BigInt.fromI32(1));

  if (fromAmountInUSD != null && feesInUSD != null) {
    total = addTotalFeesAndVolume(total as Total, fromAmountInUSD, feesInUSD);
    dailyTotal = addDailyTotalFeesAndVolume(dailyTotal as DailyTotal, fromAmountInUSD, feesInUSD);
    fifteenMinuteTotal = addFifteenMinuteTotalFeesAndVolume(
      fifteenMinuteTotal as FifteenMinuteTotal,
      fromAmountInUSD,
      feesInUSD,
    );
  }
  total.save();
  dailyTotal.save();
  fifteenMinuteTotal.save();
}

export function handleExchangeReclaim(event: ExchangeReclaimEvent): void {
  let txHash = event.transaction.hash.toHex();
  let entity = new ExchangeReclaim(txHash + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.amount = event.params.amount;
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  let latestRate = getLatestRate(event.params.currencyKey.toString(), txHash);

  if (latestRate == null) {
    log.error('handleExchangeReclaim has an issue in tx hash: {}', [txHash]);
    return;
  }
  entity.amountInUSD = getUSDAmountFromAssetAmount(event.params.amount, latestRate);
  entity.save();
}

export function handleExchangeRebate(event: ExchangeRebateEvent): void {
  let txHash = event.transaction.hash.toHex();
  let entity = new ExchangeRebate(txHash + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.amount = event.params.amount;
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  let latestRate = getLatestRate(event.params.currencyKey.toString(), txHash);

  if (latestRate == null) {
    log.error('handleExchangeReclaim has an issue in tx hash: {}', [txHash]);
    return;
  }
  entity.amountInUSD = getUSDAmountFromAssetAmount(event.params.amount, latestRate);
  entity.save();
}

function loadTotal(): Total {
  let newTotal = new Total('mainnet');
  newTotal.trades = BigInt.fromI32(0);
  newTotal.exchangers = BigInt.fromI32(0);
  newTotal.exchangeUSDTally = new BigDecimal(BigInt.fromI32(0));
  newTotal.totalFeesGeneratedInUSD = new BigDecimal(BigInt.fromI32(0));
  return newTotal;
}

function loadDailyTotal(id: string): DailyTotal {
  let newDailyTotal = new DailyTotal(id);
  newDailyTotal.trades = BigInt.fromI32(0);
  newDailyTotal.exchangers = BigInt.fromI32(0);
  newDailyTotal.exchangeUSDTally = new BigDecimal(BigInt.fromI32(0));
  newDailyTotal.totalFeesGeneratedInUSD = new BigDecimal(BigInt.fromI32(0));
  return newDailyTotal;
}

function loadFifteenMinuteTotal(id: string): FifteenMinuteTotal {
  let newFifteenMinuteTotal = new FifteenMinuteTotal(id);
  newFifteenMinuteTotal.trades = BigInt.fromI32(0);
  newFifteenMinuteTotal.exchangers = BigInt.fromI32(0);
  newFifteenMinuteTotal.exchangeUSDTally = new BigDecimal(BigInt.fromI32(0));
  newFifteenMinuteTotal.totalFeesGeneratedInUSD = new BigDecimal(BigInt.fromI32(0));
  return newFifteenMinuteTotal;
}

function addTotalFeesAndVolume(total: Total, fromAmountInUSD: BigDecimal, feesInUSD: BigDecimal): Total {
  total.exchangeUSDTally = total.exchangeUSDTally.plus(fromAmountInUSD);
  total.totalFeesGeneratedInUSD = total.totalFeesGeneratedInUSD.plus(feesInUSD);
  return total;
}

function addDailyTotalFeesAndVolume(
  dailyTotal: DailyTotal,
  fromAmountInUSD: BigDecimal,
  feesInUSD: BigDecimal,
): DailyTotal {
  dailyTotal.exchangeUSDTally = dailyTotal.exchangeUSDTally.plus(fromAmountInUSD);
  dailyTotal.totalFeesGeneratedInUSD = dailyTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
  return dailyTotal;
}

function addFifteenMinuteTotalFeesAndVolume(
  fifteenMinuteTotal: FifteenMinuteTotal,
  fromAmountInUSD: BigDecimal,
  feesInUSD: BigDecimal,
): FifteenMinuteTotal {
  fifteenMinuteTotal.exchangeUSDTally = fifteenMinuteTotal.exchangeUSDTally.plus(fromAmountInUSD);
  fifteenMinuteTotal.totalFeesGeneratedInUSD = fifteenMinuteTotal.totalFeesGeneratedInUSD.plus(feesInUSD);
  return fifteenMinuteTotal;
}
