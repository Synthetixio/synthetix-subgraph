import {
  MarketCreated as MarketCreatedEvent,
  MarketExpired as MarketExpiredEvent,
  MarketExpired,
} from '../generated/BinaryOptionMarketManager/BinaryOptionMarketManager';
import {
  Bid as BidEvent,
  Refund as RefundEvent,
  PricesUpdated as PricesUpdatedEvent,
  MarketResolved as MarketResolvedEvent,
  OptionsClaimed as OptionsClaimedEvent,
  OptionsExercised as OptionsExercisedEvent,
  BinaryOptionMarket,
} from '../generated/templates/BinaryOptionMarket/BinaryOptionMarket';
import { Market, OptionTransaction, HistoricalOptionPrice } from '../generated/schema';
import { BinaryOptionMarket as BinaryOptionMarketContract } from '../generated/templates';

export function handleNewMarket(event: MarketCreatedEvent): void {
  BinaryOptionMarketContract.create(event.params.market);
  let binaryOptionContract = BinaryOptionMarket.bind(event.params.market);
  let prices = binaryOptionContract.prices();

  let entity = new Market(event.params.market.toHex());
  entity.creator = event.params.creator;
  entity.timestamp = event.block.timestamp;
  entity.currencyKey = event.params.oracleKey;
  entity.strikePrice = event.params.strikePrice;
  entity.biddingEndDate = event.params.biddingEndDate;
  entity.maturityDate = event.params.maturityDate;
  entity.expiryDate = event.params.expiryDate;
  entity.isOpen = true;
  entity.longPrice = prices.value0;
  entity.shortPrice = prices.value1;
  entity.poolSize = binaryOptionContract.exercisableDeposits();
  entity.save();
}

export function handleMarketExpired(event: MarketExpiredEvent): void {
  let marketEntity = Market.load(event.params.market.toHex());
  marketEntity.isOpen = false;
  marketEntity.save();
}

export function handleNewBid(event: BidEvent): void {
  let marketEntity = Market.load(event.address.toHex());
  let entity = new OptionTransaction(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.type = 'bid';
  entity.timestamp = event.block.timestamp;
  entity.account = event.params.account;
  entity.market = event.address;
  entity.currencyKey = marketEntity.currencyKey;
  entity.side = event.params.side;
  entity.amount = event.params.value;
  entity.save();
}

export function handleNewRefund(event: RefundEvent): void {
  let market = Market.load(event.address.toHex());
  let entity = new OptionTransaction(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.type = 'refund';
  entity.timestamp = event.block.timestamp;
  entity.account = event.params.account;
  entity.market = event.address;
  entity.currencyKey = market.currencyKey;
  entity.side = event.params.side;
  entity.amount = event.params.value;
  entity.fee = event.params.fee;
  entity.save();
}

export function handleNewPricesUpdate(event: PricesUpdatedEvent): void {
  let marketId = event.address.toHex();
  let binaryOptionContract = BinaryOptionMarket.bind(event.address);
  let marketEntity = Market.load(marketId);
  let poolSize = binaryOptionContract.exercisableDeposits();
  let entity = new HistoricalOptionPrice(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.timestamp = event.block.timestamp;
  entity.longPrice = event.params.longPrice;
  entity.shortPrice = event.params.shortPrice;
  entity.market = event.address;
  entity.poolSize = poolSize;
  entity.save();

  marketEntity.longPrice = event.params.longPrice;
  marketEntity.shortPrice = event.params.shortPrice;
  marketEntity.poolSize = poolSize;
  marketEntity.save();
}

export function handleMarketResolved(event: MarketResolvedEvent): void {
  let market = Market.load(event.address.toHex());
  market.result = event.params.result;
  market.poolSize = event.params.deposited;
  market.save();
}

export function handleOptionsClaimed(event: OptionsClaimedEvent): void {
  let marketEntity = Market.load(event.address.toHex());
  let binaryOptionContract = BinaryOptionMarket.bind(event.address);
  let poolSize = binaryOptionContract.exercisableDeposits();

  marketEntity.poolSize = poolSize;
  marketEntity.save();
}

export function handleOptionsExercised(event: OptionsExercisedEvent): void {
  let marketEntity = Market.load(event.address.toHex());
  let binaryOptionContract = BinaryOptionMarket.bind(event.address);
  let poolSize = binaryOptionContract.exercisableDeposits();

  marketEntity.poolSize = poolSize;
  marketEntity.save();
}
