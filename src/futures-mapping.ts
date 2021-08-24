import { store, Address } from '@graphprotocol/graph-ts';
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

import { FuturesMarket as FuturesMarketEntity, FuturesPosition } from '../generated/schema';

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
  let marketEntity = FuturesMarketEntity.load(proxyAddress.toHex());
  let positionEntity = FuturesPosition.load(positionId);
  if (positionEntity == null) {
    positionEntity = new FuturesPosition(positionId);
    positionEntity.market = proxyAddress;
    positionEntity.asset = marketEntity.asset;
    positionEntity.account = event.params.account;
    positionEntity.isLiquidated = false;
    positionEntity.isOpen = true;
    positionEntity.size = event.params.size;
    positionEntity.entryPrice = event.params.lastPrice;
  }
  if (event.params.size.isZero() == true) {
    positionEntity.isOpen = false;
    positionEntity.exitPrice = futuresMarketContract.assetPrice().value0;
  } else {
    positionEntity.entryPrice = event.params.lastPrice;
    positionEntity.size = event.params.size;
  }
  positionEntity.margin = event.params.margin;
  positionEntity.lastTxHash = event.transaction.hash;
  positionEntity.timestamp = event.block.timestamp;
  positionEntity.save();
}

export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  let futuresMarketContract = FuturesMarketContract.bind(event.transaction.to as Address);
  let proxyAddress = futuresMarketContract.proxy();
  let positionId = proxyAddress.toHex() + '-' + event.params.id.toHex();
  let positionEntity = FuturesPosition.load(positionId);
  positionEntity.isLiquidated = true;
  positionEntity.save();
}
