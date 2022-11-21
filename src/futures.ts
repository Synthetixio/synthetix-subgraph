import { Address, BigInt, Bytes, DataSourceContext, store } from '@graphprotocol/graph-ts';

import {
  FuturesMarket as FuturesMarketEntity,
  FuturesMarginTransfer,
  FuturesMarginAccount,
  FuturesPosition,
  FuturesTrade,
  FuturesStat,
  FuturesCumulativeStat,
  FuturesHourlyStat,
  FuturesOneMinStat,
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
  FundingRecomputed as FundingRecomputedEvent,
  NextPriceOrderSubmitted as NextPriceOrderSubmittedEvent,
  NextPriceOrderRemoved as NextPriceOrderRemovedEvent,
} from '../generated/subgraphs/futures/templates/FuturesMarket/FuturesMarket';
import { FuturesMarket } from '../generated/subgraphs/futures/templates';
import { BPS_CONVERSION, ETHER, ONE_HOUR_SECONDS, ONE_MINUTE_SECONDS, ZERO } from './lib/helpers';

let SINGLE_INDEX = '0';

// temporary cross-margin fee solution
let CROSSMARGIN_TRADING_BPS = BigInt.fromI32(2);

export function handleMarketAdded(event: MarketAddedEvent): void {
  let marketEntity = new FuturesMarketEntity(event.params.market.toHex());
  marketEntity.asset = event.params.asset;
  let marketStats = getOrCreateMarketCumulativeStats(event.params.asset.toHex());
  marketStats.save();
  marketEntity.marketStats = marketStats.id;
  marketEntity.save();

  let context = new DataSourceContext();
  context.setString('market', event.params.market.toHex());
  FuturesMarket.createWithContext(event.params.market, context);
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
    if (marketEntity && marketEntity.asset) {
      positionEntity.asset = marketEntity.asset;
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
    positionEntity.fundingIndex = event.params.fundingIndex;
  }

  if (event.params.tradeSize.isZero() == false) {
    let tradeEntity = new FuturesTrade(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    tradeEntity.timestamp = event.block.timestamp;
    tradeEntity.account = account;
    tradeEntity.abstractAccount = sendingAccount;
    tradeEntity.accountType = accountType;
    tradeEntity.size = event.params.tradeSize;
    tradeEntity.margin = event.params.margin.plus(event.params.fee);
    tradeEntity.positionSize = event.params.size;
    tradeEntity.positionId = positionId;
    tradeEntity.price = event.params.lastPrice;
    tradeEntity.feesPaid = event.params.fee;
    tradeEntity.orderType = 'Market';

    // add cross margin fee if appropriate
    if (accountType === 'cross_margin') {
      tradeEntity.feesPaid = tradeEntity.feesPaid.plus(
        event.params.tradeSize
          .abs()
          .times(event.params.lastPrice)
          .div(ETHER)
          .times(CROSSMARGIN_TRADING_BPS)
          .div(BPS_CONVERSION),
      );
    }

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

    if (accountType === 'cross_margin') {
      statEntity.crossMarginVolume = statEntity.crossMarginVolume.plus(volume);
    }

    positionEntity.trades = positionEntity.trades.plus(BigInt.fromI32(1));
    positionEntity.totalVolume = positionEntity.totalVolume.plus(volume);

    const oneMinTimestamp = getTimeID(event.block.timestamp, ONE_MINUTE_SECONDS);
    let oneMinStat = FuturesOneMinStat.load(oneMinTimestamp.toString());
    if (oneMinStat == null) {
      oneMinStat = new FuturesOneMinStat(oneMinTimestamp.toString());
      oneMinStat.trades = BigInt.fromI32(1);
      oneMinStat.volume = volume;
      oneMinStat.timestamp = oneMinTimestamp;
    } else {
      oneMinStat.trades = oneMinStat.trades.plus(BigInt.fromI32(1));
      oneMinStat.volume = oneMinStat.volume.plus(volume);
    }
    oneMinStat.save();

    const oneHourTimestamp = getTimeID(event.block.timestamp, ONE_HOUR_SECONDS);
    if (marketEntity && marketEntity.asset) {
      let marketCumulativeStats = getOrCreateMarketCumulativeStats(marketEntity.asset.toHex());
      marketCumulativeStats.totalTrades = marketCumulativeStats.totalTrades.plus(BigInt.fromI32(1));
      marketCumulativeStats.totalVolume = marketCumulativeStats.totalVolume.plus(volume);
      marketCumulativeStats.averageTradeSize = marketCumulativeStats.totalVolume.div(marketCumulativeStats.totalTrades);
      marketCumulativeStats.save();

      let marketHourlyStats = getOrCreateMarketHourlyStats(marketEntity.asset, oneHourTimestamp);
      marketHourlyStats.trades = marketHourlyStats.trades.plus(BigInt.fromI32(1));
      marketHourlyStats.volume = marketHourlyStats.volume.plus(volume);
      marketHourlyStats.save();
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

      // temporarily set the pnl to the total margin in the account before liquidation
      // we will check this again in the PositionLiquidated event
      tradeEntity.pnl = positionEntity.margin.times(BigInt.fromI32(-1));
      tradeEntity.margin = ZERO;
      tradeEntity.positionSize = ZERO;
      tradeEntity.positionId = positionId;
      tradeEntity.price = event.params.lastPrice;
      tradeEntity.feesPaid = event.params.fee;
      tradeEntity.orderType = 'Liquidation';
      tradeEntity.asset = positionEntity.asset;
      tradeEntity.positionClosed = true;
      tradeEntity.save();
    } else if (marginTransferEntity) {
      // if margin transfer exists, add it to net transfers
      positionEntity.netTransfers = positionEntity.netTransfers.plus(marginTransferEntity.size);

      // if a deposit, add to deposits
      if (marginTransferEntity.size.gt(ZERO)) {
        positionEntity.totalDeposits = positionEntity.totalDeposits.plus(marginTransferEntity.size);
      }
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
  const crossMarginFees =
    accountType === 'cross_margin'
      ? event.params.tradeSize
          .abs()
          .times(event.params.lastPrice)
          .div(ETHER)
          .times(CROSSMARGIN_TRADING_BPS)
          .div(BPS_CONVERSION)
      : ZERO;

  statEntity.feesPaid = statEntity.feesPaid.plus(event.params.fee).plus(crossMarginFees);
  statEntity.pnlWithFeesPaid = statEntity.pnl.minus(statEntity.feesPaid);

  // update global values
  positionEntity.size = event.params.size;
  positionEntity.margin = event.params.margin;
  positionEntity.lastPrice = event.params.lastPrice;
  positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.fee).plus(crossMarginFees);
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
  if (statEntity && statEntity.liquidations) {
    statEntity.liquidations = statEntity.liquidations.plus(BigInt.fromI32(1));
    statEntity.save();
  }
  if (positionEntity) {
    positionEntity.isLiquidated = true;
    positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.fee);
    positionEntity.pnlWithFeesPaid = positionEntity.initialMargin
      .plus(positionEntity.netTransfers)
      .times(BigInt.fromI32(-1));
    positionEntity.pnl = positionEntity.pnlWithFeesPaid.plus(positionEntity.feesPaid).minus(positionEntity.netFunding);
    positionEntity.save();
  }
  if (tradeEntity) {
    tradeEntity.size = event.params.size.times(BigInt.fromI32(-1));
    tradeEntity.positionSize = ZERO;
    tradeEntity.feesPaid = tradeEntity.feesPaid.plus(event.params.fee);
    tradeEntity.pnl = tradeEntity.pnl.plus(event.params.fee);
    tradeEntity.save();
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

function getOrCreateMarketCumulativeStats(asset: string): FuturesCumulativeStat {
  let cumulativeEntity = FuturesCumulativeStat.load(asset);
  if (cumulativeEntity == null) {
    cumulativeEntity = new FuturesCumulativeStat(asset);
    cumulativeEntity.totalLiquidations = ZERO;
    cumulativeEntity.totalTrades = ZERO;
    cumulativeEntity.totalTraders = ZERO;
    cumulativeEntity.totalVolume = ZERO;
    cumulativeEntity.averageTradeSize = ZERO;
  }
  return cumulativeEntity as FuturesCumulativeStat;
}

function getOrCreateMarketHourlyStats(asset: Bytes, timestamp: BigInt): FuturesHourlyStat {
  const id = `${timestamp.toString()}-${asset.toHex()}`;
  let hourlyEntity = FuturesHourlyStat.load(id);
  if (hourlyEntity == null) {
    hourlyEntity = new FuturesHourlyStat(id);
    hourlyEntity.timestamp = timestamp;
    hourlyEntity.asset = asset;
    hourlyEntity.trades = ZERO;
    hourlyEntity.volume = ZERO;
  }
  return hourlyEntity as FuturesHourlyStat;
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

  if (marketEntity && marketEntity.asset) {
    marginTransferEntity.asset = marketEntity.asset;
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

      futuresOrderEntity.orderType = 'NextPrice';
      futuresOrderEntity.status = 'Pending';
      futuresOrderEntity.asset = marketAsset;
      futuresOrderEntity.market = futuresMarketAddress;
      futuresOrderEntity.account = account;
      futuresOrderEntity.abstractAccount = sendingAccount;
      futuresOrderEntity.size = event.params.sizeDelta;
      futuresOrderEntity.orderId = event.params.targetRoundId;
      futuresOrderEntity.targetRoundId = event.params.targetRoundId;
      futuresOrderEntity.timestamp = event.block.timestamp;

      futuresOrderEntity.save();
    }
  }
}

export function handleNextPriceOrderRemoved(event: NextPriceOrderRemovedEvent): void {
  if (event.params.trackingCode.toString() == 'KWENTA') {
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
}
