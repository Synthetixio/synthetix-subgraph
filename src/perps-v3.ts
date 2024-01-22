import {
  Account,
  CollateralChange,
  DelegatedAccount,
  FundingRatePeriod,
  FundingRateUpdate,
  OpenPerpsV3Position,
  OrderSettled,
  PerpsV3AggregateStat,
  PerpsV3Market,
  PerpsV3Position,
  SettlementStrategy,
} from '../generated/subgraphs/perps-v3/schema';
import {
  AccountCreated,
  MarketUpdated,
  OrderSettled as OrderSettledEvent,
  PositionLiquidated as PositionLiquidatedEvent,
  PermissionGranted as PermissionGrantedEvent,
  PermissionRevoked as PermissionRevokedEvent,
  CollateralModified as CollateralModifiedEvent,
} from '../generated/subgraphs/perps-v3/PerpsV3/PerpsV3MarketProxy';
import { BigInt, log, store } from '@graphprotocol/graph-ts';
import {
  DAY_SECONDS,
  ETHER,
  FUNDING_RATE_PERIODS,
  FUNDING_RATE_PERIOD_TYPES,
  ONE,
  ONE_HOUR_SECONDS,
  ZERO,
  getTimeID,
  strToBytes,
} from './lib/helpers';
import {
  MarketCreated,
  SettlementStrategyAdded,
  SettlementStrategySet,
} from '../generated/subgraphs/perps-v3/PerpsV3/PerpsV3MarketProxy';

const AGG_PERIODS = [ONE_HOUR_SECONDS, DAY_SECONDS];

export function handleMarketCreated(event: MarketCreated): void {
  let marketId = event.params.perpsMarketId.toString();
  let market = new PerpsV3Market(marketId);
  market.marketSymbol = event.params.marketSymbol;
  market.marketName = event.params.marketName;
  market.save();
}

export function handleAccountCreated(event: AccountCreated): void {
  const accountId = event.params.accountId;
  let account = Account.load(accountId.toString());

  if (account == null) {
    account = new Account(accountId.toString());
    account.owner = event.params.owner;
    account.created_at = event.block.timestamp;
    account.created_at_block = event.block.number;
    account.updated_at = event.block.timestamp;
    account.updated_at_block = event.block.number;
    account.permissions = [];
    account.save();
  }
}

export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  const positionId = event.params.marketId.toString() + '-' + event.params.accountId.toString();
  const openPosition = OpenPerpsV3Position.load(positionId);

  if (openPosition === null) {
    log.warning('Position entity not found for positionId {}', [positionId]);
    return;
  } else if (openPosition.position !== null) {
    let positionEntity = PerpsV3Position.load(openPosition.position!);
    if (positionEntity !== null) {
      positionEntity.isLiquidated = true;
      positionEntity.isOpen = false;
      openPosition.position = null;
      positionEntity.save();
      openPosition.save();
    }
  }
}

export function handleOrderSettled(event: OrderSettledEvent): void {
  const orderId = event.params.accountId.toString() + '-' + event.block.timestamp.toString();
  const order = new OrderSettled(orderId);
  order.accountId = event.params.accountId;
  order.account = event.params.accountId.toString();
  order.accruedFunding = event.params.accruedFunding;
  order.collectedFees = event.params.collectedFees;
  order.fillPrice = event.params.fillPrice;
  order.marketId = event.params.marketId;
  order.timestamp = event.block.timestamp;
  order.totalFees = event.params.totalFees;
  order.trackingCode = event.params.trackingCode;
  order.settlementReward = event.params.settlementReward;
  order.sizeDelta = event.params.sizeDelta;
  order.newSize = event.params.newSize;
  order.referralFees = event.params.referralFees;
  order.settler = event.params.settler;
  order.pnl = ZERO;

  let positionId = event.params.marketId.toString() + '-' + event.params.accountId.toString();
  let openPositionEntity = OpenPerpsV3Position.load(positionId);
  if (openPositionEntity == null) {
    openPositionEntity = new OpenPerpsV3Position(positionId);
  }

  let positionEntity = PerpsV3Position.load(openPositionEntity.position !== null ? openPositionEntity.position! : '');
  let volume = order.sizeDelta.abs().times(order.fillPrice).div(ETHER).abs();

  if (positionEntity == null) {
    let marketEntity = PerpsV3Market.load(event.params.marketId.toString());

    if (marketEntity == null) {
      log.warning('Market entity not found for marketId {}', [event.params.marketId.toString()]);
      return;
    }

    let positionEntity = new PerpsV3Position(positionId + '-' + event.block.timestamp.toString());
    openPositionEntity.position = positionEntity.id;

    positionEntity.marketId = event.params.marketId;
    if (marketEntity) {
      positionEntity.marketSymbol = marketEntity.marketSymbol;
    }

    positionEntity.accountId = event.params.accountId;
    positionEntity.account = event.params.accountId.toString();
    positionEntity.isLiquidated = false;
    positionEntity.isOpen = true;
    positionEntity.size = event.params.sizeDelta;
    positionEntity.timestamp = event.block.timestamp;
    positionEntity.openTimestamp = event.block.timestamp;
    positionEntity.avgEntryPrice = event.params.fillPrice;
    positionEntity.totalTrades = BigInt.fromI32(1);
    positionEntity.entryPrice = event.params.fillPrice;
    positionEntity.lastPrice = event.params.fillPrice;
    positionEntity.realizedPnl = ZERO;
    positionEntity.feesPaid = event.params.totalFees;
    positionEntity.netFunding = event.params.accruedFunding;
    positionEntity.pnlWithFeesPaid = ZERO;
    positionEntity.totalVolume = volume;

    updateAggregateStatEntities(
      positionEntity.marketId,
      positionEntity.marketSymbol,
      event.block.timestamp,
      ONE,
      volume,
    );

    positionEntity.save();
  } else {
    if (event.params.newSize.isZero()) {
      positionEntity.isOpen = false;
      positionEntity.closeTimestamp = event.block.timestamp;
      positionEntity.exitPrice = event.params.fillPrice;
      openPositionEntity.position = null;
      openPositionEntity.save();

      calculatePnl(positionEntity, order, event);
    } else {
      positionEntity.totalTrades = positionEntity.totalTrades.plus(BigInt.fromI32(1));
      positionEntity.totalVolume = positionEntity.totalVolume.plus(volume);

      if (
        (positionEntity.size.lt(ZERO) && event.params.newSize.gt(ZERO)) ||
        (positionEntity.size.gt(ZERO) && event.params.newSize.lt(ZERO))
      ) {
        // TODO: Better handle flipping sides
        calculatePnl(positionEntity, order, event);
        positionEntity.avgEntryPrice = event.params.fillPrice;
        positionEntity.entryPrice = event.params.fillPrice;
      } else if (event.params.newSize.abs().gt(positionEntity.size.abs())) {
        // If ths positions size is increasing then recalculate the average entry price
        const existingNotionalValue = positionEntity.size.abs().times(positionEntity.avgEntryPrice);
        const tradeNotionalValue = event.params.sizeDelta.abs().times(event.params.fillPrice);
        positionEntity.avgEntryPrice = existingNotionalValue.plus(tradeNotionalValue).div(event.params.newSize.abs());
      } else {
        // If decreasing calc the pnl
        calculatePnl(positionEntity, order, event);
      }
    }
    positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.totalFees);
    positionEntity.netFunding = positionEntity.netFunding.plus(event.params.accruedFunding);
    positionEntity.size = positionEntity.size.plus(event.params.sizeDelta);

    updateAggregateStatEntities(
      positionEntity.marketId,
      positionEntity.marketSymbol,
      event.block.timestamp,
      ONE,
      volume,
    );

    positionEntity.save();
  }
  openPositionEntity.save();

  order.save();
}

export function handleSettlementStrategyAdded(event: SettlementStrategyAdded): void {
  const id = event.params.strategyId.toString() + '-' + event.params.marketId.toString();
  const strategy = new SettlementStrategy(id);

  strategy.strategyId = event.params.strategyId;
  strategy.marketId = event.params.marketId;

  strategy.strategyType = event.params.strategy.strategyType;
  strategy.settlementDelay = event.params.strategy.settlementDelay;
  strategy.settlementWindowDuration = event.params.strategy.settlementWindowDuration;
  strategy.priceVerificationContract = event.params.strategy.priceVerificationContract.toHexString();
  strategy.commitmentPriceDelay = event.params.strategy.commitmentPriceDelay;
  strategy.feedId = event.params.strategy.feedId;
  strategy.settlementReward = event.params.strategy.settlementReward;
  strategy.enabled = !event.params.strategy.disabled;

  strategy.save();
}

export function handleSettlementStrategyEnabled(event: SettlementStrategySet): void {
  const id = event.params.strategyId.toString() + '-' + event.params.marketId.toString();
  const strategy = SettlementStrategy.load(id);

  if (!strategy) {
    return;
  }

  strategy.enabled = !event.params.strategy.disabled;
  strategy.strategyType = event.params.strategy.strategyType;
  strategy.settlementDelay = event.params.strategy.settlementDelay;
  strategy.settlementWindowDuration = event.params.strategy.settlementWindowDuration;
  strategy.priceVerificationContract = event.params.strategy.priceVerificationContract.toHexString();
  strategy.commitmentPriceDelay = event.params.strategy.commitmentPriceDelay;
  strategy.feedId = event.params.strategy.feedId;
  strategy.settlementReward = event.params.strategy.settlementReward;
  strategy.save();
}

export function handleFundingRecomputed(event: MarketUpdated): void {
  let marketEntity = PerpsV3Market.load(event.params.marketId.toString());

  let fundingRateUpdateEntity = new FundingRateUpdate(
    event.params.marketId.toString() + '-' + event.transaction.hash.toHex(),
  );

  fundingRateUpdateEntity.timestamp = event.block.timestamp;
  fundingRateUpdateEntity.marketId = event.params.marketId;
  fundingRateUpdateEntity.fundingRate = event.params.currentFundingRate;

  if (marketEntity) {
    fundingRateUpdateEntity.marketSymbol = marketEntity.marketSymbol;
    fundingRateUpdateEntity.marketName = marketEntity.marketName;
    updateFundingRatePeriods(event.block.timestamp, marketEntity.marketSymbol, fundingRateUpdateEntity);
  }

  fundingRateUpdateEntity.save();
}

export function handlePermissionGranted(event: PermissionGrantedEvent): void {
  if (event.params.permission.toHex().startsWith(strToBytes('PERPS_COMMIT_ASYNC_ORDER').toHex())) {
    let id = event.params.accountId.toHex().concat('-').concat(event.params.user.toHex());
    let entity = DelegatedAccount.load(id);

    if (entity == null) {
      entity = new DelegatedAccount(id);
    }

    entity.caller = event.params.sender;
    entity.delegate = event.params.user;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
  }
}

export function handlePermissionRevoked(event: PermissionRevokedEvent): void {
  if (event.params.permission.toHex().startsWith(strToBytes('PERPS_COMMIT_ASYNC_ORDER').toHex())) {
    let id = event.params.accountId.toHex().concat('-').concat(event.params.user.toHex());
    let entity = DelegatedAccount.load(id);

    if (entity != null) {
      store.remove('DelegatedAccount', id);
    }
  }
}

function updateFundingRatePeriods(timestamp: BigInt, asset: string, rate: FundingRateUpdate): void {
  for (let p = 0; p < FUNDING_RATE_PERIODS.length; p++) {
    let periodSeconds = FUNDING_RATE_PERIODS[p];
    let periodType = FUNDING_RATE_PERIOD_TYPES[p];
    let periodId = getTimeID(timestamp, periodSeconds);

    let id = asset + '-' + periodType + '-' + periodId.toString();

    let existingPeriod = FundingRatePeriod.load(id);

    if (existingPeriod == null) {
      let newPeriod = new FundingRatePeriod(id);
      newPeriod.fundingRate = rate.fundingRate;
      newPeriod.marketSymbol = rate.marketSymbol;
      newPeriod.marketName = rate.marketName;
      newPeriod.period = periodType;
      newPeriod.timestamp = timestamp.minus(timestamp.mod(periodSeconds));
      newPeriod.save();
    } else {
      existingPeriod.fundingRate = rate.fundingRate;
      existingPeriod.save();
    }
  }
}

function calculatePnl(position: PerpsV3Position, order: OrderSettled, event: OrderSettledEvent): void {
  let pnl = event.params.fillPrice
    .minus(position.avgEntryPrice)
    .times(event.params.sizeDelta.abs())
    .div(ETHER)
    .times(position.size.gt(ZERO) ? BigInt.fromI32(1) : BigInt.fromI32(-1));
  position.realizedPnl = position.realizedPnl.plus(pnl);
  position.pnlWithFeesPaid = position.realizedPnl.minus(position.feesPaid);
  order.pnl = order.pnl.plus(pnl);
  order.save();
  position.save();
}

export function handleCollateralModified(event: CollateralModifiedEvent): void {
  const accountId = event.params.accountId;
  const account = Account.load(accountId.toString());

  if (account !== null) {
    let collateralChange = new CollateralChange(accountId.toString() + '-' + event.transaction.hash.toHex());

    collateralChange.synthId = event.params.synthMarketId;
    collateralChange.accountId = accountId;
    collateralChange.sender = event.params.sender;
    collateralChange.timestamp = event.block.timestamp;
    collateralChange.amountDelta = event.params.amountDelta;
    collateralChange.txHash = event.transaction.hash.toHex();
    collateralChange.save();
  }
}

function getOrCreateMarketAggregateStats(
  marketId: BigInt,
  marketSymbol: string,
  timestamp: BigInt,
  period: BigInt,
): PerpsV3AggregateStat {
  // helper function for creating a market aggregate entity if one doesn't exist
  // this allows functions to safely call this function without checking for null
  const id = `${timestamp.toString()}-${period.toString()}-${marketSymbol}`;
  let aggregateEntity = PerpsV3AggregateStat.load(id);
  if (aggregateEntity == null) {
    aggregateEntity = new PerpsV3AggregateStat(id);
    aggregateEntity.period = period;
    aggregateEntity.timestamp = timestamp;
    aggregateEntity.marketId = marketId;
    aggregateEntity.marketSymbol = marketSymbol;
    aggregateEntity.trades = ZERO;
    aggregateEntity.volume = ZERO;
  }
  return aggregateEntity as PerpsV3AggregateStat;
}

export function updateAggregateStatEntities(
  marketId: BigInt,
  marketSymbol: string,
  timestamp: BigInt,
  trades: BigInt,
  volume: BigInt,
): void {
  // this function updates the aggregate stat entities for the specified account and market
  // it is called when users interact with positions or when positions are liquidated
  // to add new aggregate periods, update the `AGG_PERIODS` array in `constants.ts`
  // new aggregates will be created for any resolution present in the array
  for (let period = 0; period < AGG_PERIODS.length; period++) {
    const thisPeriod = AGG_PERIODS[period];
    const aggTimestamp = getTimeID(timestamp, thisPeriod);

    // update the aggregate for this market
    let aggStats = getOrCreateMarketAggregateStats(marketId, marketSymbol, aggTimestamp, thisPeriod);
    aggStats.trades = aggStats.trades.plus(trades);
    aggStats.volume = aggStats.volume.plus(volume);
    aggStats.save();
  }
}
