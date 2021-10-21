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

import { FuturesMarket as FuturesMarketEntity, FuturesPosition, FuturesTrade, FuturesStat } from '../generated/schema';
import { ZERO } from './common';

let ETHER = BigInt.fromI32(10).pow(18);

export function handleMarketAdded(event: MarketAddedEvent): void {
  let futuresMarketContract = FuturesMarketContract.bind(event.params.market);
  let proxyAddress = futuresMarketContract.proxy();
  FuturesMarket.create(proxyAddress);
  let marketEntity = new FuturesMarketEntity(proxyAddress.toHex());
  marketEntity.asset = event.params.asset;
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
}
