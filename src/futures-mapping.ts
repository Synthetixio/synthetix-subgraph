import {
  MarketAdded as MarketAddedEvent,
  MarketRemoved as MarketRemovedEvent,
} from '../generated/FuturesMarketManager/FuturesMarketManager';
import {
  PositionLiquidated as PositionLiquidatedEvent,
  OrderSubmitted as OrderSubmittedEvent,
  OrderConfirmed as OrderConfirmedEvent,
  OrderCancelled as OrderCancelledEvent,
  FuturesMarket,
} from '../generated/templates/FuturesMarket/FuturesMarket';
import { Market, Liquidation, Order } from '../generated/schema';
import { store } from '@graphprotocol/graph-ts';
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

export function handleOrderSubmitted(event: OrderSubmittedEvent): void {
  let futuresMarketEntity = Market.load(event.address.toHex());
  let entity = new Order(event.address.toHex() + '-' + event.params.id.toString());
  entity.account = event.params.account;
  entity.margin = event.params.margin;
  entity.leverage = event.params.leverage;
  entity.status = 'pending';
  entity.fee = event.params.fee;
  entity.roundId = event.params.roundId;
  entity.currency = futuresMarketEntity.asset;
  entity.market = event.address;
  entity.timestamp = event.block.timestamp;

  entity.save();
}

export function handleOrderConfirmed(event: OrderConfirmedEvent): void {
  let entity = Order.load(event.address.toHex() + '-' + event.params.id.toString());
  entity.status = 'confirmed';
  entity.save();
}

export function HandleOrderCancelledEvent(event: OrderCancelledEvent): void {
  let entity = Order.load(event.address.toHex() + '-' + event.params.id.toString());
  store.remove('Order', entity.id);
}
