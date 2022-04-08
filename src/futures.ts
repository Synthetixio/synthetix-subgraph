import { Address, BigInt, store, log, ByteArray, Bytes } from '@graphprotocol/graph-ts';

import {
  FuturesMarket as FuturesMarketEntity,
  FuturesMarginTransfer,
  FuturesPosition,
  FuturesTrade,
  FuturesStat,
  FuturesCumulativeStat,
  FuturesOneMinStat,
  FundingRateUpdate,
} from '../generated/subgraphs/futures/schema';
import {
  MarketAdded as MarketAddedEvent,
  MarketRemoved as MarketRemovedEvent,
} from '../generated/subgraphs/futures/futures_FuturesMarketManager_0/FuturesMarketManager';
import {
  PositionLiquidated as PositionLiquidatedEvent,
  PositionModified as PositionModifiedEvent,
  FuturesMarket as FuturesMarketContract,
  MarginTransferred as MarginTransferredEvent,
  FundingRecomputed as FundingRecomputedEvent,
} from '../generated/subgraphs/futures/futures_FuturesMarketManager_0/FuturesMarket';
import { ZERO } from './lib/helpers';

let ETHER = BigInt.fromI32(10).pow(18);
let ONE_MINUTE_SECONDS = BigInt.fromI32(60);
let SINGLE_INDEX = '0';

export function handleMarketAdded(event: MarketAddedEvent): void {
  let marketEntity = new FuturesMarketEntity(event.params.market.toHex());
  marketEntity.asset = event.params.asset;
  let marketStats = getOrCreateMarketStats(event.params.asset.toHex());
  marketStats.save();
  marketEntity.marketStats = marketStats.id;
  marketEntity.save();
}

export function handleMarketRemoved(event: MarketRemovedEvent): void {
  store.remove('FuturesMarket', event.params.market.toHex());
}

export function handlePositionModified(event: PositionModifiedEvent): void {
  let futuresMarketAddress = event.address as Address;
  let positionId = futuresMarketAddress.toHex() + '-' + event.params.id.toHex();
  let statId = event.params.account.toHex();
  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
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
    statEntity.totalVolume = ZERO;
  }
  if (event.params.tradeSize.isZero() == false) {
    let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    tradeEntity.timestamp = event.block.timestamp;
    tradeEntity.account = event.params.account;
    tradeEntity.size = event.params.tradeSize;
    tradeEntity.price = event.params.lastPrice;
    if (marketEntity && marketEntity.asset) {
      tradeEntity.asset = marketEntity.asset;
    }
    statEntity.totalTrades = statEntity.totalTrades.plus(BigInt.fromI32(1));
    tradeEntity.save();

    let volume = tradeEntity.size.times(tradeEntity.price).div(ETHER).abs();
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
    if (marketEntity && marketEntity.asset) {
      let marketStats = getOrCreateMarketStats(marketEntity.asset.toHex());
      marketStats.totalTrades = marketStats.totalTrades.plus(BigInt.fromI32(1));
      marketStats.totalVolume = marketStats.totalVolume.plus(volume);
      marketStats.averageTradeSize = marketStats.totalVolume.div(marketStats.totalTrades);
      marketStats.save();
    }
  }

  // if it's a new position...
  if (positionEntity == null) {
    positionEntity = new FuturesPosition(positionId);
    positionEntity.market = futuresMarketAddress;
    if (marketEntity && marketEntity.asset) {
      positionEntity.asset = marketEntity.asset;
    }
    positionEntity.account = event.params.account;
    positionEntity.isLiquidated = false;
    positionEntity.isOpen = true;
    positionEntity.size = event.params.size;
    positionEntity.entryPrice = event.params.lastPrice;
    positionEntity.margin = event.params.margin;
    positionEntity.feesPaid = ZERO;
    positionEntity.netFunding = ZERO;
    positionEntity.fundingIndex = event.params.fundingIndex;
  }

  // if the position is closed during this transaction...
  if (event.params.size.isZero() == true) {
    positionEntity.isOpen = false;
    positionEntity.exitPrice = event.params.lastPrice;
    const exitPrice = positionEntity.exitPrice;
    if (exitPrice) {
      statEntity.pnl = statEntity.pnl.plus(
        positionEntity.size.times(exitPrice.minus(positionEntity.entryPrice)).div(ETHER),
      );
      statEntity.totalVolume = statEntity.totalVolume.plus(
        positionEntity.size.times(positionEntity.entryPrice).div(ETHER),
      );
    }
  } else {
    // if position changes sides, reset the entry price
    if (
      (positionEntity.size.lt(ZERO) && event.params.size.gt(ZERO)) ||
      (positionEntity.size.gt(ZERO) && event.params.size.lt(ZERO))
    ) {
      positionEntity.entryPrice = event.params.lastPrice;
    } else {
      // check if the position side increases (long or short)
      if (event.params.size.abs().gt(positionEntity.size.abs())) {
        // if so, calculate the new average price
        const existingSize = positionEntity.size.abs();
        const existingPrice = existingSize.times(positionEntity.entryPrice);

        const newSize = event.params.tradeSize.abs();
        const newPrice = newSize.times(event.params.lastPrice);
        positionEntity.entryPrice = existingPrice.plus(newPrice).div(event.params.size.abs());
      }
      // otherwise do nothing
    }
  }

  //Calc fees paid to exchange and include in PnL
  statEntity.feesPaid = statEntity.feesPaid.plus(event.params.fee);
  statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);

  // add accrued funding to position
  if (positionEntity.fundingIndex != event.params.fundingIndex) {
    let pastFundingEntity = FundingRateUpdate.load(
      futuresMarketAddress.toHex() + '-' + positionEntity.fundingIndex.toString(),
    );

    let currentFundingEntity = FundingRateUpdate.load(
      futuresMarketAddress.toHex() + '-' + event.params.fundingIndex.toString(),
    );

    if (pastFundingEntity && currentFundingEntity) {
      // add accrued funding
      let fundingAccrued = currentFundingEntity.funding
        .minus(pastFundingEntity.funding)
        .times(positionEntity.size)
        .div(ETHER);

      positionEntity.netFunding = positionEntity.netFunding.plus(fundingAccrued);

      // set the new index
      positionEntity.fundingIndex = event.params.fundingIndex;
    }
  }

  // update global values
  positionEntity.size = event.params.size;
  positionEntity.margin = event.params.margin;
  positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.fee);
  positionEntity.lastTxHash = event.transaction.hash;
  positionEntity.timestamp = event.block.timestamp;

  positionEntity.save();
  statEntity.save();
  cumulativeEntity.save();
}

export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  let futuresMarketAddress = event.transaction.to as Address;
  let positionId = futuresMarketAddress.toHex() + '-' + event.params.id.toHex();
  let positionEntity = FuturesPosition.load(positionId);
  let statId = event.params.account.toHex();
  let statEntity = FuturesStat.load(statId);
  if (statEntity && statEntity.liquidations) {
    statEntity.liquidations = statEntity.liquidations.plus(BigInt.fromI32(1));
    statEntity.save();
  }
  if (positionEntity) {
    positionEntity.isLiquidated = true;
    positionEntity.save();
  }
  let cumulativeEntity = getOrCreateCumulativeEntity();
  cumulativeEntity.totalLiquidations = cumulativeEntity.totalLiquidations.plus(BigInt.fromI32(1));
  cumulativeEntity.save();

  if (positionEntity && positionEntity.asset) {
    let marketStats = getOrCreateMarketStats(positionEntity.asset.toHex());
    marketStats.totalLiquidations = marketStats.totalLiquidations.plus(BigInt.fromI32(1));
    marketStats.save();
  }
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

export function handleMarginTransferred(event: MarginTransferredEvent): void {
  let futuresMarketAddress = event.transaction.to as Address;
  const txHash = event.transaction.hash.toHex();
  let marginTransferEntity = new FuturesMarginTransfer(
    futuresMarketAddress.toHex() + '-' + txHash + '-' + event.logIndex.toString(),
  );
  marginTransferEntity.timestamp = event.block.timestamp;
  marginTransferEntity.account = event.params.account;
  marginTransferEntity.market = futuresMarketAddress;
  marginTransferEntity.size = event.params.marginDelta;
  marginTransferEntity.save();
}

export function handleFundingRecomputed(event: FundingRecomputedEvent): void {
  let futuresMarketAddress = event.transaction.to as Address;
  let fundingRateUpdateEntity = new FundingRateUpdate(
    futuresMarketAddress.toHex() + '-' + event.params.index.toString(),
  );
  fundingRateUpdateEntity.timestamp = event.params.timestamp;
  fundingRateUpdateEntity.market = futuresMarketAddress;
  fundingRateUpdateEntity.sequenceLength = event.params.index;
  fundingRateUpdateEntity.funding = event.params.funding;
  fundingRateUpdateEntity.save();
}
