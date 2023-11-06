import { AccountCreated } from '../generated/subgraphs/perps-v3/templates/PerpsV3/PerpsV3CoreProxy';
import {
  Account,
  OpenPerpsV3Position,
  OrderSettled,
  PerpsV3Market,
  PerpsV3Position,
  SettlementStrategy,
} from '../generated/subgraphs/perps-v3/schema';
import {
  OrderSettled as OrderSettledEvent,
  PositionLiquidated as PositionLiquidatedEvent,
} from '../generated/subgraphs/perps-v3/templates/PerpsV3/PerpsV3MarketProxy';
import { BigInt, log } from '@graphprotocol/graph-ts';
import { ETHER, ZERO } from './lib/helpers';
import {
  MarketCreated,
  SettlementStrategyAdded,
  SettlementStrategyEnabled,
} from '../generated/subgraphs/perps-v3/PerpsV3/PerpsV3MarketProxy';

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
  order.save();

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
    positionEntity.save();
  } else {
    if (event.params.newSize.isZero()) {
      positionEntity.isOpen = false;
      positionEntity.closeTimestamp = event.block.timestamp;
      positionEntity.exitPrice = event.params.fillPrice;
      openPositionEntity.position = null;
      openPositionEntity.save();
    } else {
      positionEntity.totalTrades = positionEntity.totalTrades.plus(BigInt.fromI32(1));

      positionEntity.totalVolume = positionEntity.totalVolume.plus(volume);

      if (
        (positionEntity.size.lt(ZERO) && event.params.newSize.gt(ZERO)) ||
        (positionEntity.size.gt(ZERO) && event.params.newSize.lt(ZERO))
      ) {
        // TODO: Handle flipping sides
        positionEntity.avgEntryPrice = event.params.fillPrice;
        positionEntity.entryPrice = event.params.fillPrice;
      } else if (event.params.newSize.abs().gt(positionEntity.size.abs())) {
        // If ths positions size is increasing then recalculate the average entry price
        const existingNotionalValue = positionEntity.size.abs().times(positionEntity.avgEntryPrice);
        const tradeNotionalValue = event.params.sizeDelta.abs().times(event.params.fillPrice);
        positionEntity.avgEntryPrice = existingNotionalValue.plus(tradeNotionalValue).div(event.params.newSize.abs());
      } else {
        // position decreasing - calc realized pnl
        const cost = positionEntity.avgEntryPrice.times(event.params.sizeDelta.abs());
        const sellValue = event.params.fillPrice.times(event.params.sizeDelta.abs());
        const tradePnl = sellValue.minus(cost);
        positionEntity.realizedPnl = positionEntity.realizedPnl.plus(tradePnl);
        positionEntity.pnlWithFeesPaid = positionEntity.realizedPnl.minus(positionEntity.feesPaid);
      }
    }
    positionEntity.feesPaid = positionEntity.feesPaid.plus(event.params.totalFees);
    positionEntity.netFunding = positionEntity.netFunding.plus(event.params.accruedFunding);
    positionEntity.size = positionEntity.size.plus(event.params.sizeDelta);
    positionEntity.save();
  }
  openPositionEntity.save();
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
  strategy.feedId = event.params.strategy.feedId;
  strategy.url = event.params.strategy.url;
  strategy.settlementReward = event.params.strategy.settlementReward;
  strategy.enabled = !event.params.strategy.disabled;

  strategy.save();
}

export function handleSettlementStrategyEnabled(event: SettlementStrategyEnabled): void {
  const id = event.params.strategyId.toString() + '-' + event.params.marketId.toString();
  const strategy = SettlementStrategy.load(id);

  if (!strategy) {
    return;
  }

  strategy.enabled = event.params.enabled;
  strategy.save();
}
