import { store, Address, BigInt } from '@graphprotocol/graph-ts';
import {
  MarketAdded as MarketAddedEvent,
  MarketRemoved as MarketRemovedEvent,
} from '../generated/FuturesMarketManager/FuturesMarketManager';

import { FuturesMarket } from '../generated/templates';
import {
  PositionLiquidated as PositionLiquidatedEvent,
  PositionModified as PositionModifiedEvent,
  FuturesMarket as FuturesMarketContract,
} from '../generated/templates/FuturesMarket/FuturesMarket';

import {
  FuturesMarket as FuturesMarketEntity,
  FuturesPosition,
  FuturesTrade,
  FuturesStat,
  FuturesCumulativeStat,
  FuturesOneMinStat,
} from '../generated/schema';
import { ZERO } from './common';

let ETHER = BigInt.fromI32(10).pow(18);
let ONE_MINUTE_SECONDS = BigInt.fromI32(60);
let SINGLE_INDEX = '0';

export function handleMarketAdded(event: MarketAddedEvent): void {
  let futuresMarketContract = FuturesMarketContract.bind(event.params.market);
  let proxyAddress = futuresMarketContract.proxy();
  FuturesMarket.create(proxyAddress);
  let marketEntity = new FuturesMarketEntity(proxyAddress.toHex());
  marketEntity.asset = event.params.asset;
  let marketStats = getOrCreateMarketStats(event.params.asset.toHex());
  marketStats.save();
  marketEntity.marketStats = marketStats.id;
  marketEntity.save();
}

export function handleMarketRemoved(event: MarketRemovedEvent): void {
  let futuresMarketContract = FuturesMarketContract.bind(event.params.market);
  let proxyAddress = futuresMarketContract.proxy();
  store.remove('FuturesMarket', proxyAddress.toHex());
}

export function handlePositionModified(event: PositionModifiedEvent): void {
  let futuresMarketContract = FuturesMarketContract.bind(event.transaction.to as Address);
  let proxyAddress = futuresMarketContract.proxy();
  let positionId = proxyAddress.toHex() + '-' + event.params.id.toHex();
  let statId = event.params.account.toHex();
  let marketEntity = FuturesMarketEntity.load(proxyAddress.toHex());
  let positionEntity = FuturesPosition.load(positionId);
  let statEntity = FuturesStat.load(statId);
  let cumulativeEntity = getOrCreateCumulativeEntity();

  if (statEntity == null) {
    statEntity = new FuturesStat(statId);
    statEntity.account = event.params.account;
    statEntity.feesPaid = ZERO;
    statEntity.pnl = ZERO;
    statEntity.pnlWithFeesPaid = ZERO;
    statEntity.liquidations = ZERO;
    statEntity.totalTrades = ZERO;
  }
  if (event.params.tradeSize.isZero() == false) {
    let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    tradeEntity.timestamp = event.block.timestamp;
    tradeEntity.account = event.params.account;
    tradeEntity.size = event.params.tradeSize;
    tradeEntity.price = event.params.lastPrice;
    tradeEntity.asset = marketEntity.asset;
    statEntity.totalTrades = statEntity.totalTrades.plus(BigInt.fromI32(1));
    tradeEntity.save();

    let volume = tradeEntity.size
      .times(tradeEntity.price)
      .div(ETHER)
      .abs();
    cumulativeEntity.totalTrades = cumulativeEntity.totalTrades.plus(BigInt.fromI32(1));
    cumulativeEntity.totalVolume = cumulativeEntity.totalVolume.plus(volume);
    cumulativeEntity.averageTradeSize = cumulativeEntity.totalVolume.div(cumulativeEntity.totalTrades);

    let timestamp = getTimeID(event.block.timestamp, ONE_MINUTE_SECONDS);
    let oneMinStat = FuturesOneMinStat.load(timestamp.toString());
    if (oneMinStat == null) {
      oneMinStat = new FuturesOneMinStat(timestamp.toString());
      oneMinStat.trades = BigInt.fromI32(1);
      oneMinStat.volume = volume;
      oneMinStat.timestamp = event.block.timestamp;
    } else {
      oneMinStat.trades = oneMinStat.trades.plus(BigInt.fromI32(1));
      oneMinStat.volume = oneMinStat.volume.plus(volume);
    }
    oneMinStat.save();

    let marketStats = getOrCreateMarketStats(marketEntity.asset.toHex());
    marketStats.totalTrades = marketStats.totalTrades.plus(BigInt.fromI32(1));
    marketStats.totalVolume = marketStats.totalVolume.plus(volume);
    marketStats.averageTradeSize = marketStats.totalVolume.div(marketStats.totalTrades);
    marketStats.save();
  }
  if (positionEntity == null) {
    positionEntity = new FuturesPosition(positionId);
    positionEntity.market = proxyAddress;
    positionEntity.asset = marketEntity.asset;
    positionEntity.account = event.params.account;
    positionEntity.isLiquidated = false;
    positionEntity.isOpen = true;
    positionEntity.size = event.params.size;
    positionEntity.entryPrice = event.params.lastPrice;
    positionEntity.margin = event.params.margin;
  }
  if (event.params.size.isZero() == true) {
    positionEntity.isOpen = false;
    positionEntity.exitPrice = futuresMarketContract.assetPrice().value0;
    statEntity.pnl = statEntity.pnl.plus(
      positionEntity.size.times(positionEntity.exitPrice.minus(positionEntity.entryPrice)).div(ETHER),
    );
  } else {
    positionEntity.entryPrice = event.params.lastPrice;
    positionEntity.size = event.params.size;
    positionEntity.margin = event.params.margin;
  }

  //Calc fees paid to exchange and include in PnL
  statEntity.feesPaid = statEntity.feesPaid.plus(event.params.fee);
  statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);

  positionEntity.lastTxHash = event.transaction.hash;
  positionEntity.timestamp = event.block.timestamp;
  positionEntity.save();
  statEntity.save();
  cumulativeEntity.save();
}

export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  let futuresMarketContract = FuturesMarketContract.bind(event.transaction.to as Address);
  let proxyAddress = futuresMarketContract.proxy();
  let positionId = proxyAddress.toHex() + '-' + event.params.id.toHex();
  let positionEntity = FuturesPosition.load(positionId);
  let statId = event.params.account.toHex();
  let statEntity = FuturesStat.load(statId);
  statEntity.liquidations = statEntity.liquidations.plus(BigInt.fromI32(1));
  statEntity.save();
  positionEntity.isLiquidated = true;
  positionEntity.save();
  let cumulativeEntity = getOrCreateCumulativeEntity();
  cumulativeEntity.totalLiquidations = cumulativeEntity.totalLiquidations.plus(BigInt.fromI32(1));
  cumulativeEntity.save();

  let marketStats = getOrCreateMarketStats(positionEntity.asset.toHex());
  marketStats.totalLiquidations = marketStats.totalLiquidations.plus(BigInt.fromI32(1));
  marketStats.save();
}

function getOrCreateCumulativeEntity(): FuturesCumulativeStat {
  let cumulativeEntity = FuturesCumulativeStat.load(SINGLE_INDEX);
  if (cumulativeEntity == null) {
    cumulativeEntity = new FuturesCumulativeStat(SINGLE_INDEX);
    cumulativeEntity.totalLiquidations = ZERO;
    cumulativeEntity.totalTrades = ZERO;
    cumulativeEntity.totalVolume = ZERO;
    cumulativeEntity.averageTradeSize = ZERO;
  }
  return cumulativeEntity as FuturesCumulativeStat;
}

function getOrCreateMarketStats(asset: string): FuturesCumulativeStat {
  let cumulativeEntity = FuturesCumulativeStat.load(asset);
  if (cumulativeEntity == null) {
    cumulativeEntity = new FuturesCumulativeStat(asset);
    cumulativeEntity.totalLiquidations = ZERO;
    cumulativeEntity.totalTrades = ZERO;
    cumulativeEntity.totalVolume = ZERO;
    cumulativeEntity.averageTradeSize = ZERO;
  }
  return cumulativeEntity as FuturesCumulativeStat;
}

function getTimeID(timestamp: BigInt, num: BigInt): BigInt {
  let remainder = timestamp.mod(num);
  return timestamp.minus(remainder);
}
