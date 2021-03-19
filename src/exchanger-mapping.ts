import {
  ExchangeEntrySettled as ExchangeEntrySettledEvent,
  ExchangeEntryAppended as ExchangeEntryAppendedEvent,
} from '../generated/Exchanger/Exchanger';

import { ExchangeTracking as ExchangeTrackingEvent } from '../generated/Synthetix/Synthetix';

import {
  ExchangeEntrySettled,
  ExchangeEntryAppended,
  LatestRate,
  DailyExchangePartner,
  ExchangePartner,
} from '../generated/schema';

import { getTimeID, getUSDAmountFromAssetAmount, toDecimal } from './helpers';

import { BigInt, log, BigDecimal } from '@graphprotocol/graph-ts';

export function handleExchangeEntrySettled(event: ExchangeEntrySettledEvent): void {
  let entity = new ExchangeEntrySettled(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.from = event.params.from;
  entity.src = event.params.src;
  entity.amount = event.params.amount;
  entity.dest = event.params.dest;
  entity.reclaim = event.params.reclaim;
  entity.rebate = event.params.rebate;
  entity.srcRoundIdAtPeriodEnd = event.params.srcRoundIdAtPeriodEnd;
  entity.destRoundIdAtPeriodEnd = event.params.destRoundIdAtPeriodEnd;
  entity.exchangeTimestamp = event.params.exchangeTimestamp;

  entity.save();
}

export function handleExchangeEntryAppended(event: ExchangeEntryAppendedEvent): void {
  let txHash = event.transaction.hash.toHex();
  let entity = new ExchangeEntryAppended(txHash + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.src = event.params.src;
  entity.amount = event.params.amount;
  entity.dest = event.params.dest;
  entity.amountReceived = event.params.amountReceived;
  entity.exchangeFeeRate = event.params.exchangeFeeRate;
  entity.roundIdForSrc = event.params.roundIdForSrc;
  entity.roundIdForDest = event.params.roundIdForDest;

  entity.save();
}

function loadNewExchangePartner(id: string): ExchangePartner {
  let newExchangePartner = new ExchangePartner(id);
  newExchangePartner.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newExchangePartner.usdFees = new BigDecimal(BigInt.fromI32(0));
  newExchangePartner.trades = BigInt.fromI32(0);
  return newExchangePartner;
}

function loadNewDailyExchangePartner(id: string, partnerID: string, dayID: string): DailyExchangePartner {
  let newDailyExchangePartner = new DailyExchangePartner(id);
  newDailyExchangePartner.partner = partnerID;
  newDailyExchangePartner.dayID = dayID;
  newDailyExchangePartner.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newDailyExchangePartner.usdFees = new BigDecimal(BigInt.fromI32(0));
  newDailyExchangePartner.trades = BigInt.fromI32(0);
  return newDailyExchangePartner;
}

export function handleExchangeTracking(event: ExchangeTrackingEvent): void {
  let txHash = event.transaction.hash.toHex();
  let synth = event.params.toCurrencyKey.toString();
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    log.error(
      'handleExchangeTracking rate missing for volume partner trade with synth: {}, and amount: {} in tx hash: {}',
      [synth, event.params.toAmount.toString(), txHash],
    );
    return;
  }
  let exchangePartnerID = event.params.trackingCode.toString();

  let exchangePartner = ExchangePartner.load(exchangePartnerID);
  if (exchangePartner == null) {
    exchangePartner = loadNewExchangePartner(exchangePartnerID);
  }
  let tradeSizeUSD = getUSDAmountFromAssetAmount(event.params.toAmount, latestRate.rate);
  // let feeSizeUSD = toDecimal(event.params.fee);
  let feeSizeUSD = toDecimal(new BigInt(1000000000000000000));

  exchangePartner.usdVolume = exchangePartner.usdVolume.plus(tradeSizeUSD);
  exchangePartner.usdFees = exchangePartner.usdFees.plus(feeSizeUSD);
  exchangePartner.trades = exchangePartner.trades.plus(BigInt.fromI32(1));
  exchangePartner.save();

  let dayID = getTimeID(event.block.timestamp.toI32(), 86400);
  let dailyExchangePartnerID = dayID + '-' + exchangePartnerID;
  let dailyExchangePartner = DailyExchangePartner.load(dailyExchangePartnerID);
  if (dailyExchangePartner == null) {
    dailyExchangePartner = loadNewDailyExchangePartner(dailyExchangePartnerID, exchangePartnerID, dayID);
  }

  dailyExchangePartner.usdVolume = dailyExchangePartner.usdVolume.plus(tradeSizeUSD);
  dailyExchangePartner.usdFees = dailyExchangePartner.usdFees.plus(feeSizeUSD);
  dailyExchangePartner.trades = dailyExchangePartner.trades.plus(BigInt.fromI32(1));
  dailyExchangePartner.save();
}
