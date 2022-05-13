import { Address, BigInt, store } from '@graphprotocol/graph-ts';

import {
  FuturesMarket as FuturesMarketEntity,
  FuturesMarginTransfer,
  FuturesPosition,
  FuturesTrade,
  FuturesStat,
  FuturesCumulativeStat,
  FuturesOneMinStat,
  FundingRateUpdate,
  FuturesOrder,
} from '../generated/subgraphs/futures/schema';
import {
  MarketAdded as MarketAddedEvent,
  MarketRemoved as MarketRemovedEvent,
} from '../generated/subgraphs/futures/futures_FuturesMarketManager_0/FuturesMarketManager';
import {
  PositionLiquidated as PositionLiquidatedEvent,
  PositionModified as PositionModifiedEvent,
  MarginTransferred as MarginTransferredEvent,
  FundingRecomputed as FundingRecomputedEvent,
  NextPriceOrderSubmitted as NextPriceOrderSubmittedEvent,
  NextPriceOrderRemoved as NextPriceOrderRemovedEvent,
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

  // create new entities
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
    positionEntity.timestamp = event.block.timestamp;
    positionEntity.openTimestamp = event.block.timestamp;
    positionEntity.avgEntryPrice = event.params.lastPrice;
    positionEntity.trades = ZERO;
    positionEntity.entryPrice = event.params.lastPrice;
    positionEntity.lastPrice = event.params.lastPrice;
    positionEntity.margin = event.params.margin;
    positionEntity.pnl = ZERO;
    positionEntity.feesPaid = ZERO;
    positionEntity.netFunding = ZERO;
    positionEntity.fundingIndex = event.params.fundingIndex;
  }

  if (event.params.tradeSize.isZero() == false) {
    let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    tradeEntity.timestamp = event.block.timestamp;
    tradeEntity.account = event.params.account;
    tradeEntity.size = event.params.tradeSize;
    tradeEntity.positionSize = event.params.size;
    tradeEntity.positionId = positionId;
    tradeEntity.price = event.params.lastPrice;
    tradeEntity.feesPaid = event.params.fee;
    tradeEntity.orderType = 'Market';

    if (marketEntity && marketEntity.asset) {
      tradeEntity.asset = marketEntity.asset;
    }
    if (event.params.size.isZero()) {
      tradeEntity.positionClosed = true;
    } else {
      tradeEntity.positionClosed = false;
    }

    // calculate pnl
    const newPnl = event.params.lastPrice.minus(positionEntity.lastPrice).times(positionEntity.size).div(ETHER);

    // add pnl to this position and the trader's overall stats
    tradeEntity.pnl = newPnl;
    tradeEntity.save();

    let volume = tradeEntity.size.times(tradeEntity.price).div(ETHER).abs();
    cumulativeEntity.totalTrades = cumulativeEntity.totalTrades.plus(BigInt.fromI32(1));
    cumulativeEntity.totalVolume = cumulativeEntity.totalVolume.plus(volume);
    cumulativeEntity.averageTradeSize = cumulativeEntity.totalVolume.div(cumulativeEntity.totalTrades);

    statEntity.totalTrades = statEntity.totalTrades.plus(BigInt.fromI32(1));
    statEntity.totalVolume = statEntity.totalVolume.plus(volume);

    positionEntity.trades = positionEntity.trades.plus(BigInt.fromI32(1));
    positionEntity.totalVolume = positionEntity.totalVolume.plus(volume);

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
  } else if (event.params.tradeSize.isZero() && event.params.size.isZero() && event.params.margin.isZero()) {
    const txHash = event.transaction.hash.toHex();
    let marginTransferEntity = FuturesMarginTransfer.load(
      futuresMarketAddress.toHex() + '-' + txHash + '-' + event.logIndex.toString(),
    );

    // this check is here to get around the fact that the sometimes a withdrawalAll margin transfer event
    // will trigger a trade entity liquidation to be created. guarding against this event for now.
    // TODO confirm this is the correct fix for the long term - https://github.com/Kwenta/kwenta/issues/843
    if (marginTransferEntity == null) {
      // if its not a withdrawal (or deposit), it's a liquidation
      let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
      tradeEntity.timestamp = event.block.timestamp;
      tradeEntity.account = event.params.account;

      // create a placeholder for trade size as long/short
      // this will help figure out the trade direction during a liquidation
      // since the position size will be set to zero before the PositionLiquidated event
      tradeEntity.size = positionEntity.size.gt(ZERO) ? BigInt.fromI32(-1) : BigInt.fromI32(1);
      tradeEntity.positionSize = ZERO;
      tradeEntity.positionId = positionId;
      tradeEntity.price = event.params.lastPrice;
      tradeEntity.feesPaid = event.params.fee;
      tradeEntity.orderType = 'Liquidation';
      tradeEntity.asset = positionEntity.asset;
      tradeEntity.positionClosed = true;
      tradeEntity.save();
    }
  }

  // if there is an existing position...
  if (positionEntity.fundingIndex != event.params.fundingIndex) {
    // add accrued funding to position
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
      statEntity.feesPaid = statEntity.feesPaid.minus(fundingAccrued);

      // set the new index
      positionEntity.fundingIndex = event.params.fundingIndex;
    }

    // calculate pnl
    const newPnl = event.params.lastPrice.minus(positionEntity.lastPrice).times(positionEntity.size).div(ETHER);

    // add pnl to this position and the trader's overall stats
    positionEntity.pnl = positionEntity.pnl.plus(newPnl);
    statEntity.pnl = statEntity.pnl.plus(newPnl);
  }

  // if the position is closed during this transaction...
  // set the exit price and close the position
  if (event.params.size.isZero() == true) {
    positionEntity.isOpen = false;
    positionEntity.exitPrice = event.params.lastPrice;
    positionEntity.closeTimestamp = event.block.timestamp;
  } else {
    // if the position is not closed...
    // if position changes sides, reset the entry price
    if (
      (positionEntity.size.lt(ZERO) && event.params.size.gt(ZERO)) ||
      (positionEntity.size.gt(ZERO) && event.params.size.lt(ZERO))
    ) {
      positionEntity.entryPrice = event.params.lastPrice; // Deprecate this after migrating frontend
      positionEntity.avgEntryPrice = event.params.lastPrice;
    } else {
      // check if the position side increases (long or short)
      if (event.params.size.abs().gt(positionEntity.size.abs())) {
        // if so, calculate the new average price
        const existingSize = positionEntity.size.abs();
        const existingPrice = existingSize.times(positionEntity.entryPrice);

        const newSize = event.params.tradeSize.abs();
        const newPrice = newSize.times(event.params.lastPrice);
        positionEntity.entryPrice = existingPrice.plus(newPrice).div(event.params.size.abs()); // Deprecate this after migrating frontend
        positionEntity.avgEntryPrice = existingPrice.plus(newPrice).div(event.params.size.abs());
      }
      // otherwise do nothing
    }
  }

  //Calc fees paid to exchange and include in PnL
  statEntity.feesPaid = statEntity.feesPaid.plus(event.params.fee);
  statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);

  // update global values
  positionEntity.size = event.params.size;
  positionEntity.margin = event.params.margin;
  positionEntity.lastPrice = event.params.lastPrice;
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
  let tradeEntity = FuturesTrade.load(
    event.transaction.hash.toHex() + '-' + event.logIndex.minus(BigInt.fromI32(1)).toString(),
  );
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
  if (tradeEntity) {
    // size will be either -1 or 1 in this scenario (see handlePositionModified for details)
    tradeEntity.size = event.params.size.times(tradeEntity.size);
    tradeEntity.positionSize = ZERO;
    tradeEntity.feesPaid = tradeEntity.feesPaid.plus(event.params.fee);
    tradeEntity.pnl = event.params.price.times(event.params.size).times(BigInt.fromI32(-1)).div(ETHER);
    tradeEntity.save();
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
  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
  let marginTransferEntity = new FuturesMarginTransfer(
    futuresMarketAddress.toHex() + '-' + txHash + '-' + event.logIndex.toString(),
  );
  marginTransferEntity.timestamp = event.block.timestamp;
  marginTransferEntity.account = event.params.account;
  marginTransferEntity.market = futuresMarketAddress;
  marginTransferEntity.size = event.params.marginDelta;
  marginTransferEntity.txHash = txHash;

  if (marketEntity && marketEntity.asset) {
    marginTransferEntity.asset = marketEntity.asset;
  }

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

export function handleNextPriceOrderSubmitted(event: NextPriceOrderSubmittedEvent): void {
  if (event.params.trackingCode.toString() == 'KWENTA') {
    let futuresMarketAddress = event.transaction.to as Address;

    const futuresOrderEntityId =
      futuresMarketAddress.toHex() +
      '-' +
      event.params.account.toHexString() +
      '-' +
      event.params.targetRoundId.toString();

    let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);

    if (futuresOrderEntity == null) {
      futuresOrderEntity = new FuturesOrder(futuresOrderEntityId);
    }

    let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());

    futuresOrderEntity.orderType = 'NextPrice';
    futuresOrderEntity.status = 'Pending';

    if (marketEntity) {
      futuresOrderEntity.asset = marketEntity.asset;
    }

    futuresOrderEntity.market = futuresMarketAddress;
    futuresOrderEntity.account = event.params.account;
    futuresOrderEntity.size = event.params.sizeDelta;
    futuresOrderEntity.targetRoundId = event.params.targetRoundId;
    futuresOrderEntity.timestamp = event.block.timestamp;

    futuresOrderEntity.save();
  }
}

export function handleNextPriceOrderRemoved(event: NextPriceOrderRemovedEvent): void {
  if (event.params.trackingCode.toString() == 'KWENTA') {
    const statId = event.params.account.toHex();
    let statEntity = FuturesStat.load(statId);

    let futuresMarketAddress = event.transaction.to as Address;
    let futuresOrderEntity = FuturesOrder.load(
      futuresMarketAddress.toHex() +
        '-' +
        event.params.account.toHexString() +
        '-' +
        event.params.targetRoundId.toString(),
    );

    if (futuresOrderEntity) {
      futuresOrderEntity.keeper = event.transaction.from;
      let tradeEntity = FuturesTrade.load(
        event.transaction.hash.toHex() + '-' + event.logIndex.minus(BigInt.fromI32(1)).toString(),
      );

      if (statEntity && tradeEntity) {
        // if trade exists get the position
        let positionEntity = FuturesPosition.load(tradeEntity.positionId);

        // update order values
        futuresOrderEntity.status = 'Filled';
        tradeEntity.orderType = 'NextPrice';

        // add fee if not self-executed
        if (futuresOrderEntity.keeper != futuresOrderEntity.account) {
          tradeEntity.feesPaid = tradeEntity.feesPaid.plus(event.params.keeperDeposit);
          statEntity.feesPaid = statEntity.feesPaid.plus(event.params.keeperDeposit);
          if (positionEntity) {
            positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.keeperDeposit);
            positionEntity.save();
          }

          statEntity.save();
        }

        tradeEntity.save();
      } else if (statEntity) {
        if (futuresOrderEntity.keeper != futuresOrderEntity.account) {
          statEntity.feesPaid = statEntity.feesPaid.plus(event.params.keeperDeposit);
          statEntity.save();
        }

        futuresOrderEntity.status = 'Cancelled';
      }

      futuresOrderEntity.save();
    }
  }
}
