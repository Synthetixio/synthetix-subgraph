import {
  MarketAdded as MarketAddedEvent,
  MarketRemoved as MarketRemovedEvent,
} from '../generated/FuturesMarketManager/FuturesMarketManager';
import {
  PositionLiquidated as PositionLiquidatedEvent,
  FuturesMarket,
} from '../generated/templates/FuturesMarket/FuturesMarket';
import { Market, Liquidation } from '../generated/schema';
import { store, Address } from '@graphprotocol/graph-ts';
import { FuturesMarket as FuturesMarketContract } from '../generated/templates';

export function handleMarketAdded(event: MarketAddedEvent): void {
  let futuresMarketContract = FuturesMarket.bind(event.params.market);
  let futuresMarketProxy = futuresMarketContract.proxy();
  FuturesMarketContract.create(futuresMarketProxy);

  let entity = new Market(futuresMarketProxy.toHex());
  entity.asset = event.params.asset;
  entity.timestamp = event.block.timestamp;

  entity.save();
}

export function handleMarketRemoved(event: MarketRemovedEvent): void {
  store.remove('Market', event.params.market.toHex());
}

export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  let futuresMarketEntity = Market.load(event.address.toHex());
  let entity = new Liquidation(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.liquidator = event.params.liquidator;
  entity.size = event.params.size;
  entity.price = event.params.price;
  entity.market = event.address;
  entity.currency = futuresMarketEntity.asset;
  entity.timestamp = event.block.timestamp;

  entity.save();
}
