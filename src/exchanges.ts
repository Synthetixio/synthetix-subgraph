import {
  Synthetix,
  SynthExchange as SynthExchangeEvent,
  ExchangeReclaim as ExchangeReclaimEvent,
  ExchangeRebate as ExchangeRebateEvent,
} from '../generated/subgraphs/synthetix-exchanges/Synthetix_0/Synthetix';
import { AddressResolver } from '../generated/subgraphs/synthetix-exchanges/Synthetix_0/AddressResolver';
import { Exchanger as ExchangerContract } from '../generated/subgraphs/synthetix-exchanger/Exchanger_0/Exchanger';

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
} from '../generated/subgraphs/synthetix-exchanges/schema';

import { BigDecimal, BigInt, Address, log } from '@graphprotocol/graph-ts';

import { strToBytes, getUSDAmountFromAssetAmount, etherUnits, getLatestRate } from './lib/helpers';

let exchangerAsBytes = strToBytes('Exchanger', 32);

interface AggregatedTotalEntity {
  trades: BigInt;
  exchangers: BigInt;
  exchangeUSDTally: BigDecimal;
  totalFeesGeneratedInUSD: BigDecimal;
  save: () => void;
}

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

function populateAggregatedTotalEntity<T extends AggregatedTotalEntity>(entity: T): T {
  entity.trades = BigInt.fromI32(0);
  entity.exchangers = BigInt.fromI32(0);
  entity.exchangeUSDTally = new BigDecimal(BigInt.fromI32(0));
  entity.totalFeesGeneratedInUSD = new BigDecimal(BigInt.fromI32(0));
  return entity;
}

function trackTotals<T extends AggregatedTotalEntity>(
  entity: T,
  existingExchanger: boolean,
  amountInUSD: BigDecimal,
  feesInUSD: BigDecimal,
): void {
  entity.trades = entity.trades.plus(BigInt.fromI32(1));

  if (!existingExchanger) entity.exchangers = entity.exchangers.plus(BigInt.fromI32(1));

  if (amountInUSD && feesInUSD) {
    entity.exchangeUSDTally = entity.exchangeUSDTally.plus(amountInUSD);
    entity.totalFeesGeneratedInUSD = entity.totalFeesGeneratedInUSD.plus(feesInUSD);
  }

  entity.save();
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

  let total = Total.load('mainnet') || populateAggregatedTotalEntity(new Total('mainnet'));
  let dailyTotal = DailyTotal.load(dayID.toString()) || populateAggregatedTotalEntity(new DailyTotal(dayID.toString()));
  let fifteenMinuteTotal =
    FifteenMinuteTotal.load(fifteenMinuteID.toString()) ||
    populateAggregatedTotalEntity(new FifteenMinuteTotal(fifteenMinuteID.toString()));

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
  trackTotals(fifteenMinuteTotal, !!existingFifteenMinuteExchanger, fromAmountInUSD, feesInUSD);
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
