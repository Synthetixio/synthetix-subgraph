import {
  ExchangeEntrySettled as ExchangeEntrySettledEvent,
  ExchangeEntryAppended as ExchangeEntryAppendedEvent,
} from '../generated/Exchanger/Exchanger';

import { ExchangeTracking as ExchangeTrackingEventV1 } from '../generated/SynthetixV1/SynthetixOldTracking';
import { ExchangeTracking as ExchangeTrackingEventV2 } from '../generated/SynthetixV2/Synthetix';

import {
  ExchangeEntrySettled,
  ExchangeEntryAppended,
  LatestRate,
  DailyExchangePartner,
  ExchangePartner,
  TemporaryExchangePartnerTracker,
} from '../generated/schema';

import { getTimeID } from './common';

import { BigInt, log, BigDecimal } from '@graphprotocol/graph-ts';

// NOTE importing and exporting methods helps to keep the files modular
import { handleRatesUpdated, handleAggregatorAnswerUpdated } from './rates-mapping';
export { handleRatesUpdated, handleAggregatorAnswerUpdated };

let etherUnits = new BigDecimal(BigInt.fromI32(10).pow(18));
let partnerProgramStart = BigInt.fromI32(10782000);
let partnerEventUpdateBlock = BigInt.fromI32(12733161);

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

  if (event.block.number > partnerProgramStart && event.block.number < partnerEventUpdateBlock) {
    let synth = event.params.src.toString();
    let latestRate = LatestRate.load(synth);
    if (latestRate == null) {
      log.error(
        'handleExchangeEntryAppended rate missing for volume partner trade with synth: {}, and amount: {} in tx hash: {}',
        [synth, event.params.amount.toString(), txHash],
      );
      return;
    }

    let tempEntity = TemporaryExchangePartnerTracker.load(txHash);

    if (tempEntity == null) {
      tempEntity = createTempEntity(txHash);
    }

    let usdVolume = getUSDAmountFromAssetAmount(event.params.amount, latestRate.rate);
    let usdFees = getFeeUSDFromVolume(usdVolume, event.params.exchangeFeeRate);

    if (tempEntity.partner != null) {
      let exchangePartner = ExchangePartner.load(tempEntity.partner);
      if (exchangePartner == null) {
        exchangePartner = loadNewExchangePartner(tempEntity.partner);
      }
      updateExchangePartner(exchangePartner as ExchangePartner, usdVolume, usdFees);

      let dayID = getTimeID(event.block.timestamp.toI32(), 86400);
      let dailyExchangePartnerID = dayID + '-' + tempEntity.partner;
      let dailyExchangePartner = DailyExchangePartner.load(dailyExchangePartnerID);

      if (dailyExchangePartner == null) {
        dailyExchangePartner = loadNewDailyExchangePartner(dailyExchangePartnerID, tempEntity.partner, dayID);
      }

      updateDailyExchangePartner(dailyExchangePartner as DailyExchangePartner, usdVolume, usdFees);
      resetTempEntity(txHash);
    } else {
      tempEntity.usdVolume = usdVolume;
      tempEntity.usdFees = usdFees;
      tempEntity.save();
    }
  }
}

export function handleExchangeTrackingV1(event: ExchangeTrackingEventV1): void {
  let txHash = event.transaction.hash.toHex();
  let exchangePartnerID = event.params.trackingCode.toString();

  let tempEntity = TemporaryExchangePartnerTracker.load(txHash);

  if (tempEntity == null) {
    tempEntity = createTempEntity(txHash);
    tempEntity.partner = exchangePartnerID;
    tempEntity.save();
    return;
  }

  if (tempEntity != null && (tempEntity.usdVolume == null || tempEntity.usdFees == null)) {
    log.error(
      'handleExchangeTracking tempEntity exists but the volume and/ or rebate is null for txhash: {}, partner: {}',
      [txHash, exchangePartnerID],
    );
    return;
  }

  let exchangePartner = ExchangePartner.load(exchangePartnerID);
  if (exchangePartner == null) {
    exchangePartner = loadNewExchangePartner(exchangePartnerID);
  }

  exchangePartner.usdVolume = exchangePartner.usdVolume.plus(tempEntity.usdVolume as BigDecimal);
  exchangePartner.usdFees = exchangePartner.usdFees.plus(tempEntity.usdFees as BigDecimal);
  exchangePartner.trades = exchangePartner.trades.plus(BigInt.fromI32(1));
  exchangePartner.save();

  let dayID = getTimeID(event.block.timestamp.toI32(), 86400);
  let dailyExchangePartnerID = dayID + '-' + exchangePartnerID;
  let dailyExchangePartner = DailyExchangePartner.load(dailyExchangePartnerID);
  if (dailyExchangePartner == null) {
    dailyExchangePartner = loadNewDailyExchangePartner(dailyExchangePartnerID, exchangePartnerID, dayID);
  }

  dailyExchangePartner.usdVolume = dailyExchangePartner.usdVolume.plus(tempEntity.usdVolume as BigDecimal);
  dailyExchangePartner.usdFees = dailyExchangePartner.usdFees.plus(tempEntity.usdFees as BigDecimal);
  dailyExchangePartner.trades = dailyExchangePartner.trades.plus(BigInt.fromI32(1));
  dailyExchangePartner.save();

  resetTempEntity(txHash);
}

export function handleExchangeTrackingV2(event: ExchangeTrackingEventV2): void {
  let txHash = event.transaction.hash.toHex();
  let synth = event.params.toCurrencyKey.toString();
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    log.error(
      'handleExchangeEntryAppended rate missing for volume partner trade with synth: {}, and amount: {} in tx hash: {}',
      [synth, event.params.toAmount.toString(), txHash],
    );
    return;
  }

  let exchangePartnerID = event.params.trackingCode.toString();
  let exchangePartner = ExchangePartner.load(exchangePartnerID);
  if (exchangePartner == null) {
    exchangePartner = loadNewExchangePartner(exchangePartnerID);
  }

  let usdVolume = getUSDAmountFromAssetAmount(event.params.toAmount, latestRate.rate);

  // Note compiler doesn't allow for BigInt.fromI32(10).pow(18);
  let dollar = BigInt.fromI32(10);
  let dollarFormatted = dollar.pow(18);
  let usdFee = getUSDAmountFromAssetAmount(event.params.fee, dollarFormatted);

  exchangePartner.usdVolume = exchangePartner.usdVolume.plus(usdVolume);
  exchangePartner.usdFees = exchangePartner.usdFees.plus(usdFee);
  exchangePartner.trades = exchangePartner.trades.plus(BigInt.fromI32(1));
  exchangePartner.save();

  let dayID = getTimeID(event.block.timestamp.toI32(), 86400);
  let dailyExchangePartnerID = dayID + '-' + exchangePartnerID;
  let dailyExchangePartner = DailyExchangePartner.load(dailyExchangePartnerID);
  if (dailyExchangePartner == null) {
    dailyExchangePartner = loadNewDailyExchangePartner(dailyExchangePartnerID, exchangePartnerID, dayID);
  }

  dailyExchangePartner.usdVolume = dailyExchangePartner.usdVolume.plus(usdVolume);
  dailyExchangePartner.usdFees = dailyExchangePartner.usdFees.plus(usdFee);
  dailyExchangePartner.trades = dailyExchangePartner.trades.plus(BigInt.fromI32(1));
  dailyExchangePartner.save();
}

function loadNewExchangePartner(id: string): ExchangePartner {
  let newExchangePartner = new ExchangePartner(id);
  newExchangePartner.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newExchangePartner.usdFees = new BigDecimal(BigInt.fromI32(0));
  newExchangePartner.trades = BigInt.fromI32(0);
  return newExchangePartner;
}

function updateExchangePartner(exchangePartner: ExchangePartner, usdVolume: BigDecimal, usdFees: BigDecimal): void {
  exchangePartner.usdVolume = exchangePartner.usdVolume.plus(usdVolume);
  exchangePartner.usdFees = exchangePartner.usdFees.plus(usdFees);
  exchangePartner.trades = exchangePartner.trades.plus(BigInt.fromI32(1));
  exchangePartner.save();
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

function updateDailyExchangePartner(
  dailyExchangePartner: DailyExchangePartner,
  usdVolume: BigDecimal,
  usdFees: BigDecimal,
): void {
  dailyExchangePartner.usdVolume = dailyExchangePartner.usdVolume.plus(usdVolume);
  dailyExchangePartner.usdFees = dailyExchangePartner.usdFees.plus(usdFees);
  dailyExchangePartner.trades = dailyExchangePartner.trades.plus(BigInt.fromI32(1));
  dailyExchangePartner.save();
}

function createTempEntity(id: string): TemporaryExchangePartnerTracker {
  let newTempEntity = new TemporaryExchangePartnerTracker(id);
  newTempEntity.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newTempEntity.usdFees = new BigDecimal(BigInt.fromI32(0));
  newTempEntity.partner = null;
  return newTempEntity;
}

function resetTempEntity(txHash: string): void {
  let tempEntity = TemporaryExchangePartnerTracker.load(txHash);
  tempEntity.usdVolume = new BigDecimal(BigInt.fromI32(0));
  tempEntity.usdFees = new BigDecimal(BigInt.fromI32(0));
  tempEntity.partner = null;
  tempEntity.save();
}

function getUSDAmountFromAssetAmount(amount: BigInt, rate: BigInt): BigDecimal {
  let decimalAmount = new BigDecimal(amount);
  let formattedDecimalAmount = decimalAmount.div(etherUnits);
  let decimalRate = new BigDecimal(rate);
  let formattedDecimalRate = decimalRate.div(etherUnits);
  return formattedDecimalRate.times(formattedDecimalAmount);
}

function getFeeUSDFromVolume(volume: BigDecimal, feeRate: BigInt): BigDecimal {
  let decimalFee = new BigDecimal(feeRate);
  let formattedDecimalFee = decimalFee.div(etherUnits);
  return volume.times(formattedDecimalFee);
}
