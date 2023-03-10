import { Address, BigInt, Bytes, log, store } from '@graphprotocol/graph-ts';

import {
  FuturesMarket as FuturesMarketEntity,
  FuturesMarginTransfer,
  FuturesMarginAccount,
  FuturesPosition,
  FuturesTrade,
  FuturesStat,
  FuturesCumulativeStat,
  FuturesAggregateStat,
  FundingRateUpdate,
  FuturesOrder,
  CrossMarginAccount,
} from '../generated/subgraphs/futures/schema';
import {
  MarketAdded as MarketAddedEvent,
  MarketRemoved as MarketRemovedEvent,
} from '../generated/subgraphs/futures/futures_FuturesMarketManager_0/FuturesMarketManager';
import {
  PositionLiquidated as PositionLiquidatedEvent,
  PositionModified as PositionModifiedEvent,
  MarginTransferred as MarginTransferredEvent,
  NextPriceOrderSubmitted as NextPriceOrderSubmittedEvent,
  NextPriceOrderRemoved as NextPriceOrderRemovedEvent,
} from '../generated/subgraphs/futures/templates/FuturesMarket/FuturesMarket';
import {
  DelayedOrderSubmitted as DelayedOrderSubmittedEvent,
  DelayedOrderRemoved as DelayedOrderRemovedEvent,
  FundingRecomputed as FundingRecomputedEvent,
} from '../generated/subgraphs/futures/templates/PerpsMarket/PerpsV2MarketProxyable';
import { FuturesMarket, PerpsMarket } from '../generated/subgraphs/futures/templates';
import { DAY_SECONDS, ETHER, ONE, ONE_HOUR_SECONDS, ZERO, ZERO_ADDRESS } from './lib/helpers';

let SINGLE_INDEX = '0';

// Timeframes to aggregate stats in seconds
export const AGG_PERIODS = [ONE_HOUR_SECONDS, DAY_SECONDS];

export function handleV1MarketAdded(event: MarketAddedEvent): void {
  const marketKey = event.params.marketKey.toString();

  // create futures market
  let marketEntity = new FuturesMarketEntity(event.params.market.toHex());
  marketEntity.asset = event.params.asset;
  marketEntity.marketKey = event.params.marketKey;

  // create market cumulative stats
  let marketStats = getOrCreateMarketCumulativeStats(event.params.marketKey.toHex());
  marketStats.save();
  marketEntity.marketStats = marketStats.id;
  marketEntity.save();

  // check that it's a v1 market before adding
  if (marketKey.startsWith('s') && !marketKey.endsWith('PERP')) {
    log.info('New V1 market added: {}', [marketKey]);

    // futures v1 market
    FuturesMarket.create(event.params.market);
  }
}

export function handleV2MarketAdded(event: MarketAddedEvent): void {
  const marketKey = event.params.marketKey.toString();

  // create futures market
  let marketEntity = new FuturesMarketEntity(event.params.market.toHex());
  marketEntity.asset = event.params.asset;
  marketEntity.marketKey = event.params.marketKey;

  // create market cumulative stats
  let marketStats = getOrCreateMarketCumulativeStats(event.params.marketKey.toHex());
  marketStats.save();
  marketEntity.marketStats = marketStats.id;
  marketEntity.save();

  // Check that it's a v2 market before adding
  if (marketKey.endsWith('PERP')) {
    log.info('New V2 market added: {}', [marketKey]);

    // perps v2 market
    PerpsMarket.create(event.params.market);
  }
}

export function handleMarketRemoved(event: MarketRemovedEvent): void {
  store.remove('FuturesMarket', event.params.market.toHex());
}

export function handlePositionModified(event: PositionModifiedEvent): void {
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;
  const accountType = crossMarginAccount ? 'cross_margin' : 'isolated_margin';

  let futuresMarketAddress = event.address as Address;
  let positionId = futuresMarketAddress.toHex() + '-' + event.params.id.toHex();
  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
  let positionEntity = FuturesPosition.load(positionId);
  let statEntity = FuturesStat.load(account.toHex());
  let cumulativeEntity = getOrCreateCumulativeEntity();
  let marginAccountEntity = FuturesMarginAccount.load(sendingAccount.toHex() + '-' + futuresMarketAddress.toHex());

  // calculated values
  const synthetixFeePaid = event.params.fee;

  // create new entities
  if (statEntity == null) {
    statEntity = new FuturesStat(account.toHex());
    statEntity.account = account;
    statEntity.feesPaid = ZERO;
    statEntity.pnl = ZERO;
    statEntity.pnlWithFeesPaid = ZERO;
    statEntity.liquidations = ZERO;
    statEntity.totalTrades = ZERO;
    statEntity.totalVolume = ZERO;
    statEntity.crossMarginVolume = ZERO;

    cumulativeEntity.totalTraders = cumulativeEntity.totalTraders.plus(BigInt.fromI32(1));
  }

  // if it's a new position...
  if (positionEntity == null) {
    positionEntity = new FuturesPosition(positionId);
    positionEntity.market = futuresMarketAddress;
    if (marketEntity) {
      positionEntity.asset = marketEntity.asset;
      positionEntity.marketKey = marketEntity.marketKey;
    }
    positionEntity.account = account;
    positionEntity.abstractAccount = sendingAccount;
    positionEntity.accountType = accountType;
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
    positionEntity.initialMargin = event.params.margin.plus(event.params.fee);
    positionEntity.pnl = ZERO;
    positionEntity.feesPaid = ZERO;
    positionEntity.netFunding = ZERO;
    positionEntity.pnlWithFeesPaid = ZERO;
    positionEntity.netTransfers = ZERO;
    positionEntity.totalDeposits = ZERO;
    positionEntity.totalVolume = ZERO;
    positionEntity.fundingIndex = event.params.fundingIndex;
  }

  // if there is an existing position, add funding
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
  }

  if (event.params.tradeSize.isZero() == false) {
    let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    tradeEntity.timestamp = event.block.timestamp;
    tradeEntity.account = account;
    tradeEntity.abstractAccount = sendingAccount;
    tradeEntity.accountType = accountType;
    tradeEntity.margin = event.params.margin.plus(synthetixFeePaid);
    tradeEntity.size = event.params.tradeSize;
    tradeEntity.asset = ZERO_ADDRESS;
    tradeEntity.marketKey = ZERO_ADDRESS;
    tradeEntity.price = event.params.lastPrice;
    tradeEntity.positionId = positionId;
    tradeEntity.positionSize = event.params.size;
    tradeEntity.pnl = ZERO;
    tradeEntity.feesPaid = synthetixFeePaid;
    tradeEntity.keeperFeesPaid = ZERO;
    tradeEntity.orderType = 'Market';
    tradeEntity.trackingCode = ZERO_ADDRESS;

    if (marketEntity) {
      tradeEntity.asset = marketEntity.asset;
      tradeEntity.marketKey = marketEntity.marketKey;
    }
    if (event.params.size.isZero()) {
      tradeEntity.positionClosed = true;
    } else {
      tradeEntity.positionClosed = false;
    }

    // calculate pnl
    // update pnl and avg entry
    // if the position is closed during this transaction...
    // set the exit price and close the position
    if (event.params.size.isZero() == true) {
      // calculate pnl
      const newPnl = event.params.lastPrice.minus(positionEntity.avgEntryPrice).times(positionEntity.size).div(ETHER);

      // add pnl to this position and the trader's overall stats
      statEntity.pnl = statEntity.pnl.plus(newPnl);
      tradeEntity.pnl = newPnl;
      positionEntity.pnl = positionEntity.pnl.plus(newPnl);

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
        // calculate pnl
        const newPnl = event.params.lastPrice.minus(positionEntity.avgEntryPrice).times(positionEntity.size).div(ETHER);

        // add pnl to this position and the trader's overall stats
        tradeEntity.pnl = newPnl;
        statEntity.pnl = statEntity.pnl.plus(newPnl);
        positionEntity.pnl = positionEntity.pnl.plus(newPnl);

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
        } else {
          // if reducing position size, calculate pnl
          // calculate pnl
          const newPnl = event.params.lastPrice
            .minus(positionEntity.avgEntryPrice)
            .times(event.params.tradeSize.abs())
            .times(event.params.size.gt(ZERO) ? BigInt.fromI32(1) : BigInt.fromI32(-1))
            .div(ETHER);

          // add pnl to this position and the trader's overall stats
          tradeEntity.pnl = newPnl;
          statEntity.pnl = statEntity.pnl.plus(newPnl);
          positionEntity.pnl = positionEntity.pnl.plus(newPnl);
        }
      }
    }
    tradeEntity.save();

    let volume = tradeEntity.size.times(tradeEntity.price).div(ETHER).abs();
    cumulativeEntity.totalTrades = cumulativeEntity.totalTrades.plus(BigInt.fromI32(1));
    cumulativeEntity.totalVolume = cumulativeEntity.totalVolume.plus(volume);
    cumulativeEntity.averageTradeSize = cumulativeEntity.totalVolume.div(cumulativeEntity.totalTrades);

    statEntity.totalTrades = statEntity.totalTrades.plus(BigInt.fromI32(1));
    statEntity.totalVolume = statEntity.totalVolume.plus(volume);

    if (accountType === 'cross_margin') {
      statEntity.crossMarginVolume = statEntity.crossMarginVolume.plus(volume);
    }

    positionEntity.trades = positionEntity.trades.plus(BigInt.fromI32(1));
    positionEntity.totalVolume = positionEntity.totalVolume.plus(volume);

    if (marketEntity && marketEntity.asset) {
      let marketCumulativeStats = getOrCreateMarketCumulativeStats(marketEntity.asset.toHex());
      marketCumulativeStats.totalTrades = marketCumulativeStats.totalTrades.plus(BigInt.fromI32(1));
      marketCumulativeStats.totalVolume = marketCumulativeStats.totalVolume.plus(volume);
      marketCumulativeStats.averageTradeSize = marketCumulativeStats.totalVolume.div(marketCumulativeStats.totalTrades);
      marketCumulativeStats.save();

      // update aggregates
      updateAggregateStatEntities(
        accountType,
        positionEntity.marketKey,
        positionEntity.asset,
        event.block.timestamp,
        ONE,
        volume,
        synthetixFeePaid,
        ZERO,
      );
    }
  } else {
    const txHash = event.transaction.hash.toHex();
    let marginTransferEntity = FuturesMarginTransfer.load(
      futuresMarketAddress.toHex() + '-' + txHash + '-' + event.logIndex.minus(BigInt.fromI32(1)).toString(),
    );

    // this check is here to get around the fact that the sometimes a withdrawalAll margin transfer event
    // will trigger a trade entity liquidation to be created. guarding against this event for now.
    if (marginTransferEntity == null && event.params.size.isZero() && event.params.margin.isZero()) {
      // if its not a withdrawal (or deposit), it's a liquidation
      let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
      tradeEntity.timestamp = event.block.timestamp;
      tradeEntity.account = account;
      tradeEntity.abstractAccount = sendingAccount;
      tradeEntity.accountType = accountType;

      // recalculate pnl to ensure a 100% position loss
      // this calculation is required since the liquidation price could result in pnl slightly above/below 100%
      const newPositionPnlWithFeesPaid = positionEntity.initialMargin
        .plus(positionEntity.netTransfers)
        .times(BigInt.fromI32(-1));
      const newPositionPnl = newPositionPnlWithFeesPaid.plus(positionEntity.feesPaid).minus(positionEntity.netFunding);
      const newTradePnl = newPositionPnl.minus(positionEntity.pnl);

      // temporarily set the pnl to the difference in the position pnl
      // we will add liquidation fees during the PositionLiquidated handler
      tradeEntity.margin = ZERO;
      tradeEntity.size = ZERO;
      tradeEntity.asset = positionEntity.asset;
      tradeEntity.marketKey = positionEntity.marketKey;
      tradeEntity.price = event.params.lastPrice;
      tradeEntity.positionId = positionId;
      tradeEntity.positionSize = ZERO;
      tradeEntity.positionClosed = true;
      tradeEntity.pnl = newTradePnl;
      tradeEntity.feesPaid = synthetixFeePaid;
      tradeEntity.keeperFeesPaid = ZERO;
      tradeEntity.orderType = 'Liquidation';
      tradeEntity.trackingCode = ZERO_ADDRESS;
      tradeEntity.save();

      // set position values
      positionEntity.pnl = newPositionPnl;
      positionEntity.pnlWithFeesPaid = newPositionPnlWithFeesPaid;

      // set stat values
      statEntity.pnl = statEntity.pnl.plus(newTradePnl);
    } else if (marginTransferEntity) {
      // if margin transfer exists, add it to net transfers
      positionEntity.netTransfers = positionEntity.netTransfers.plus(marginTransferEntity.size);

      // if a deposit, add to deposits
      if (marginTransferEntity.size.gt(ZERO)) {
        positionEntity.totalDeposits = positionEntity.totalDeposits.plus(marginTransferEntity.size);
      }
    }
  }

  statEntity.feesPaid = statEntity.feesPaid.plus(synthetixFeePaid);
  statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);

  // update global values
  positionEntity.size = event.params.size;
  positionEntity.margin = event.params.margin;
  positionEntity.lastPrice = event.params.lastPrice;
  positionEntity.feesPaid = positionEntity.feesPaid.plus(synthetixFeePaid);
  positionEntity.pnlWithFeesPaid = positionEntity.pnl.minus(positionEntity.feesPaid).plus(positionEntity.netFunding);
  positionEntity.lastTxHash = event.transaction.hash;
  positionEntity.timestamp = event.block.timestamp;

  // update margin account
  if (marginAccountEntity) {
    marginAccountEntity.margin = event.params.margin;
    marginAccountEntity.timestamp = event.block.timestamp;
    marginAccountEntity.save();
  }

  positionEntity.save();
  statEntity.save();
  cumulativeEntity.save();
}

export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;

  let futuresMarketAddress = event.address as Address;
  let positionId = futuresMarketAddress.toHex() + '-' + event.params.id.toHex();
  let positionEntity = FuturesPosition.load(positionId);
  let tradeEntity = FuturesTrade.load(
    event.transaction.hash.toHex() + '-' + event.logIndex.minus(BigInt.fromI32(1)).toString(),
  );

  let statEntity = FuturesStat.load(account.toHex());
  if (positionEntity) {
    // update position
    positionEntity.isLiquidated = true;
    positionEntity.isOpen = false;
    positionEntity.closeTimestamp = event.block.timestamp;
    positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.fee);

    // adjust pnl for the additional fee paid
    positionEntity.pnl = positionEntity.pnl.plus(event.params.fee);
    positionEntity.pnlWithFeesPaid = positionEntity.pnl.minus(positionEntity.feesPaid).plus(positionEntity.netFunding);
    positionEntity.save();

    // update stats
    if (statEntity) {
      statEntity.liquidations = statEntity.liquidations.plus(BigInt.fromI32(1));
      statEntity.feesPaid = statEntity.feesPaid.plus(event.params.fee);
      statEntity.pnl = statEntity.pnl.plus(event.params.fee);
      statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);
      statEntity.save();
    }

    // update trade
    if (tradeEntity) {
      tradeEntity.size = event.params.size.times(BigInt.fromI32(-1));
      tradeEntity.positionSize = ZERO;
      tradeEntity.feesPaid = tradeEntity.feesPaid.plus(event.params.fee);
      tradeEntity.pnl = tradeEntity.pnl.plus(event.params.fee);
      tradeEntity.save();
    }
  }

  let cumulativeEntity = getOrCreateCumulativeEntity();
  cumulativeEntity.totalLiquidations = cumulativeEntity.totalLiquidations.plus(BigInt.fromI32(1));
  cumulativeEntity.save();

  if (positionEntity && positionEntity.asset) {
    let marketCumulativeStats = getOrCreateMarketCumulativeStats(positionEntity.asset.toHex());
    marketCumulativeStats.totalLiquidations = marketCumulativeStats.totalLiquidations.plus(BigInt.fromI32(1));
    marketCumulativeStats.save();
  }
}

function getOrCreateCumulativeEntity(): FuturesCumulativeStat {
  let cumulativeEntity = FuturesCumulativeStat.load(SINGLE_INDEX);
  if (cumulativeEntity == null) {
    cumulativeEntity = new FuturesCumulativeStat(SINGLE_INDEX);
    cumulativeEntity.totalLiquidations = ZERO;
    cumulativeEntity.totalTrades = ZERO;
    cumulativeEntity.totalTraders = ZERO;
    cumulativeEntity.totalVolume = ZERO;
    cumulativeEntity.averageTradeSize = ZERO;
  }
  return cumulativeEntity as FuturesCumulativeStat;
}

function getOrCreateMarketCumulativeStats(marketKey: string): FuturesCumulativeStat {
  let cumulativeEntity = FuturesCumulativeStat.load(marketKey);
  if (cumulativeEntity == null) {
    cumulativeEntity = new FuturesCumulativeStat(marketKey);
    cumulativeEntity.totalLiquidations = ZERO;
    cumulativeEntity.totalTrades = ZERO;
    cumulativeEntity.totalTraders = ZERO;
    cumulativeEntity.totalVolume = ZERO;
    cumulativeEntity.averageTradeSize = ZERO;
  }
  return cumulativeEntity as FuturesCumulativeStat;
}

function getOrCreateMarketAggregateStats(
  marketKey: Bytes,
  asset: Bytes,
  timestamp: BigInt,
  period: BigInt,
): FuturesAggregateStat {
  const id = `${timestamp.toString()}-${period.toString()}-${asset.toHex()}`;
  let aggregateEntity = FuturesAggregateStat.load(id);
  if (aggregateEntity == null) {
    aggregateEntity = new FuturesAggregateStat(id);
    aggregateEntity.period = period;
    aggregateEntity.timestamp = timestamp;
    aggregateEntity.marketKey = marketKey;
    aggregateEntity.asset = asset;
    aggregateEntity.trades = ZERO;
    aggregateEntity.volume = ZERO;
    aggregateEntity.feesKwenta = ZERO;
    aggregateEntity.feesSynthetix = ZERO;
    aggregateEntity.feesCrossMarginAccounts = ZERO;
  }
  return aggregateEntity as FuturesAggregateStat;
}

export function updateAggregateStatEntities(
  accountType: string,
  marketKey: Bytes,
  asset: Bytes,
  timestamp: BigInt,
  trades: BigInt,
  volume: BigInt,
  feesSynthetix: BigInt,
  feesKwenta: BigInt,
): void {
  for (let period = 0; period < AGG_PERIODS.length; period++) {
    const thisPeriod = AGG_PERIODS[period];
    const aggTimestamp = getTimeID(timestamp, thisPeriod);
    const totalFees = feesSynthetix.plus(feesKwenta);
    const feesCrossMarginAccounts = accountType === 'cross_margin' ? totalFees : ZERO;

    // update the aggregate for this market
    let aggStats = getOrCreateMarketAggregateStats(marketKey, asset, aggTimestamp, thisPeriod);
    aggStats.trades = aggStats.trades.plus(trades);
    aggStats.volume = aggStats.volume.plus(volume);
    aggStats.feesSynthetix = aggStats.feesSynthetix.plus(feesSynthetix);
    aggStats.feesKwenta = aggStats.feesKwenta.plus(feesKwenta);
    aggStats.feesCrossMarginAccounts = aggStats.feesCrossMarginAccounts.plus(feesCrossMarginAccounts);
    aggStats.save();

    // update the aggregate for all markets
    let aggCumulativeStats = getOrCreateMarketAggregateStats(new Bytes(0), new Bytes(0), aggTimestamp, thisPeriod);
    aggCumulativeStats.trades = aggCumulativeStats.trades.plus(trades);
    aggCumulativeStats.volume = aggCumulativeStats.volume.plus(volume);
    aggCumulativeStats.feesSynthetix = aggCumulativeStats.feesSynthetix.plus(feesSynthetix);
    aggCumulativeStats.feesKwenta = aggCumulativeStats.feesKwenta.plus(feesKwenta);
    aggCumulativeStats.feesCrossMarginAccounts =
      aggCumulativeStats.feesCrossMarginAccounts.plus(feesCrossMarginAccounts);
    aggCumulativeStats.save();
  }
}

function getTimeID(timestamp: BigInt, num: BigInt): BigInt {
  let remainder = timestamp.mod(num);
  return timestamp.minus(remainder);
}

export function handleMarginTransferred(event: MarginTransferredEvent): void {
  let futuresMarketAddress = event.address as Address;
  const txHash = event.transaction.hash.toHex();
  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());

  // handle margin transfer
  let marginTransferEntity = new FuturesMarginTransfer(
    futuresMarketAddress.toHex() + '-' + txHash + '-' + event.logIndex.toString(),
  );
  marginTransferEntity.timestamp = event.block.timestamp;
  marginTransferEntity.account = event.params.account;
  marginTransferEntity.market = futuresMarketAddress;
  marginTransferEntity.size = event.params.marginDelta;
  marginTransferEntity.txHash = txHash;

  if (marketEntity) {
    marginTransferEntity.asset = marketEntity.asset;
    marginTransferEntity.marketKey = marketEntity.marketKey;
  }

  // handle margin account
  let marginAccountEntity = FuturesMarginAccount.load(
    event.params.account.toHex() + '-' + futuresMarketAddress.toHex(),
  );

  // make account if this is the first deposit
  if (marginAccountEntity == null) {
    marginAccountEntity = new FuturesMarginAccount(event.params.account.toHex() + '-' + futuresMarketAddress.toHex());

    marginAccountEntity.timestamp = event.block.timestamp;
    marginAccountEntity.account = event.params.account;
    marginAccountEntity.market = futuresMarketAddress;
    marginAccountEntity.margin = ZERO;
    marginAccountEntity.deposits = ZERO;
    marginAccountEntity.withdrawals = ZERO;

    if (marketEntity && marketEntity.asset) {
      marginAccountEntity.asset = marketEntity.asset;

      // add a new trader to market stats
      let marketStats = getOrCreateMarketCumulativeStats(marketEntity.asset.toHex());
      marketStats.totalTraders = marketStats.totalTraders.plus(BigInt.fromI32(1));
      marketStats.save();
    }
  }

  if (event.params.marginDelta.gt(ZERO)) {
    marginAccountEntity.deposits = marginAccountEntity.deposits.plus(event.params.marginDelta.abs());
  }

  if (event.params.marginDelta.lt(ZERO)) {
    marginAccountEntity.withdrawals = marginAccountEntity.withdrawals.plus(event.params.marginDelta.abs());
  }

  marginTransferEntity.save();
  marginAccountEntity.save();
}

export function handleFundingRecomputed(event: FundingRecomputedEvent): void {
  let futuresMarketAddress = event.address as Address;
  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());

  let fundingRateUpdateEntity = new FundingRateUpdate(
    futuresMarketAddress.toHex() + '-' + event.params.index.toString(),
  );
  fundingRateUpdateEntity.timestamp = event.params.timestamp;
  fundingRateUpdateEntity.market = futuresMarketAddress;
  fundingRateUpdateEntity.sequenceLength = event.params.index;
  fundingRateUpdateEntity.funding = event.params.funding;
  fundingRateUpdateEntity.fundingRate = event.params.fundingRate;
  fundingRateUpdateEntity.asset = ZERO_ADDRESS;
  fundingRateUpdateEntity.marketKey = ZERO_ADDRESS;

  if (marketEntity) {
    fundingRateUpdateEntity.asset = marketEntity.asset;
    fundingRateUpdateEntity.marketKey = marketEntity.marketKey;
  }

  fundingRateUpdateEntity.save();
}

export function handleNextPriceOrderSubmitted(event: NextPriceOrderSubmittedEvent): void {
  let futuresMarketAddress = event.address as Address;
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;

  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
  if (marketEntity) {
    let marketAsset = marketEntity.asset;
    let marketKey = marketEntity.marketKey;

    const futuresOrderEntityId = `NP-${marketAsset}-${sendingAccount.toHexString()}-${event.params.targetRoundId.toString()}`;

    let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
    if (futuresOrderEntity == null) {
      futuresOrderEntity = new FuturesOrder(futuresOrderEntityId);
    }

    futuresOrderEntity.size = event.params.sizeDelta;
    futuresOrderEntity.asset = marketAsset;
    futuresOrderEntity.marketKey = marketKey;
    futuresOrderEntity.market = futuresMarketAddress;
    futuresOrderEntity.account = account;
    futuresOrderEntity.abstractAccount = sendingAccount;
    futuresOrderEntity.orderId = event.params.targetRoundId;
    futuresOrderEntity.targetRoundId = event.params.targetRoundId;
    futuresOrderEntity.targetPrice = ZERO;
    futuresOrderEntity.marginDelta = ZERO;
    futuresOrderEntity.timestamp = event.block.timestamp;
    futuresOrderEntity.orderType = 'NextPrice';
    futuresOrderEntity.status = 'Pending';
    futuresOrderEntity.keeper = ZERO_ADDRESS;

    futuresOrderEntity.save();
  }
}

export function handleNextPriceOrderRemoved(event: NextPriceOrderRemovedEvent): void {
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;

  let statEntity = FuturesStat.load(account.toHex());

  let futuresMarketAddress = event.address as Address;

  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
  if (marketEntity) {
    let marketAsset = marketEntity.asset;

    const futuresOrderEntityId = `NP-${marketAsset}-${sendingAccount.toHexString()}-${event.params.targetRoundId.toString()}`;

    let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);

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

export function handleDelayedOrderSubmitted(event: DelayedOrderSubmittedEvent): void {
  let futuresMarketAddress = event.address as Address;
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;

  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
  if (marketEntity) {
    let marketAsset = marketEntity.asset;

    const futuresOrderEntityId = `NP-${marketAsset}-${sendingAccount.toHexString()}-${event.params.targetRoundId.toString()}`;

    let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);
    if (futuresOrderEntity == null) {
      futuresOrderEntity = new FuturesOrder(futuresOrderEntityId);
    }

    futuresOrderEntity.size = event.params.sizeDelta;
    futuresOrderEntity.asset = marketAsset;
    futuresOrderEntity.marketKey = marketEntity.marketKey;
    futuresOrderEntity.market = futuresMarketAddress;
    futuresOrderEntity.account = account;
    futuresOrderEntity.abstractAccount = sendingAccount;
    futuresOrderEntity.orderId = event.params.targetRoundId;
    futuresOrderEntity.targetRoundId = event.params.targetRoundId;
    futuresOrderEntity.targetPrice = ZERO;
    futuresOrderEntity.marginDelta = ZERO;
    futuresOrderEntity.timestamp = event.block.timestamp;
    futuresOrderEntity.orderType = event.params.isOffchain ? 'DelayedOffchain' : 'Delayed';
    futuresOrderEntity.status = 'Pending';
    futuresOrderEntity.keeper = ZERO_ADDRESS;

    futuresOrderEntity.save();
  }
}

export function handleDelayedOrderRemoved(event: DelayedOrderRemovedEvent): void {
  let sendingAccount = event.params.account;
  let crossMarginAccount = CrossMarginAccount.load(sendingAccount.toHex());
  const account = crossMarginAccount ? crossMarginAccount.owner : sendingAccount;
  const accountType = crossMarginAccount ? 'cross_margin' : 'isolated_margin';

  let statEntity = FuturesStat.load(account.toHex());

  let futuresMarketAddress = event.address as Address;

  let marketEntity = FuturesMarketEntity.load(futuresMarketAddress.toHex());
  if (marketEntity) {
    let marketAsset = marketEntity.asset;

    const futuresOrderEntityId = `NP-${marketAsset}-${sendingAccount.toHexString()}-${event.params.targetRoundId.toString()}`;

    let futuresOrderEntity = FuturesOrder.load(futuresOrderEntityId);

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
        tradeEntity.orderType = futuresOrderEntity.orderType;
        tradeEntity.trackingCode = event.params.trackingCode;

        // add fee if not self-executed
        if (futuresOrderEntity.keeper != futuresOrderEntity.account) {
          tradeEntity.feesPaid = tradeEntity.feesPaid.plus(event.params.keeperDeposit);
          tradeEntity.keeperFeesPaid = event.params.keeperDeposit;
          statEntity.feesPaid = statEntity.feesPaid.plus(event.params.keeperDeposit);
          if (positionEntity) {
            positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.keeperDeposit);
            positionEntity.save();
          }

          // add fees based on tracking code
          if (event.params.trackingCode.toString() == 'KWENTA') {
            updateAggregateStatEntities(
              accountType,
              marketEntity.marketKey,
              marketEntity.asset,
              event.block.timestamp,
              ZERO,
              ZERO,
              ZERO,
              tradeEntity.feesPaid, // add kwenta fees
            );
          }

          statEntity.save();
        }

        tradeEntity.save();
      } else {
        futuresOrderEntity.status = 'Cancelled';
      }

      futuresOrderEntity.save();
    }
  }
}
