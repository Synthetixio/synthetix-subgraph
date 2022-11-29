# Kwenta Subgraph

## Overview

[The Graph](https://thegraph.com/) is a decentralized protocol for indexing and querying data on the Ethereum blockchain. Subgraphs define the data The Graph will index and how it will be stored. This data is then provided via a GraphQL API.

The Graph currently consists of a hosted service and a decentralized network. In the future, the hosted service will be gradually sunset after the decentralized network achieves feature parity.

### Hosted Service

The Kwenta subgraphs are available on the hosted service:

- **[optimism](https://thegraph.com/hosted-service/subgraph/kwenta/optimism-main)**
- **[mainnet](https://thegraph.com/hosted-service/subgraph/kwenta/mainnet-main)**
- **[optimism-kovan](https://thegraph.com/hosted-service/subgraph/kwenta/optimism-kovan-main)**

**⚠️ Using subgraphs with the hosted service may introduce breaking changes.** The Kwenta subgraphs are under active development. Because The Graph does not currently support pinning subgraph versions on the hosted service, these subgraphs should be used with caution.

## Usage

### Query the hosted service directly

This code snippet demonstrates how to retrieve all exchanges that occured in the last 24 hours:

```javascript
(async () => {
  const ts = Math.floor(Date.now() / 1e3);
  const oneDayAgo = ts - 3600 * 24;
  const body = JSON.stringify({
    query: `{
      futuresPositions (
        orderBy:timestamp,
        orderDirection:desc,
        where:{timestamp_gt: ${oneDayAgo}}
      )
      {
        id
        account
        isOpen
        totalVolume
        pnl
        avgEntryPrice
      }
    }`,
    variables: null,
  });

  const response = await fetch('https://api.thegraph.com/subgraphs/name/kwenta/optimism-main', {
    method: 'POST',
    body,
  });

  const json = await response.json();
  const { futuresPositions } = json.data;
  // ...
  console.log(futuresPositions);
})();
```

Explore all of the entities available in the subgraph in [the playground](https://thegraph.com/hosted-service/subgraph/kwenta/optimism-main?selected=playground).

_Due to limitation imposed by The Graph, only 1,000 results will be returned from the query above. Review [The Graph's documentation on pagination](https://thegraph.com/docs/graphql-api#pagination) for more information._

## Subgraph Entities

Find detailed documentation for the more commonly accessed subgraph entities below.

### Candle

The Candle entity stores pricing data for each futures market provided by Chainlink oracles over various time periods. This contains all of the data necessary to generate the candlestick charts on Kwenta's [futures markets](https://kwenta.io/market/sETH)

- `id` (string) - The unique identifier for this candle, represented as _synth_-_period_-_periodId_. (_periodId_ is calculated by dividing the current timestamp by the period.)
- `synth` (string) - The ticker symbol for synth (e.g. sUSD) or SNX.
- `period` (integer) - The duration this candle is tracking, in seconds. Various time periods are available, ranging from 1 minute to 30 days.
- `open` (integer) - The price reported at the beginning of this period. Because of oracle update frequency, this will usually be the `close` price of the previous candle.
- `high` (integer) - The highest price reported during this period.
- `low` (integer) - The lowest price reported during this period.
- `close` (integer) - The price reported at the end of this period.
- `timestamp` (integer) - The timestamp, in seconds, at the beginning of this period.
- `average` (integer) - The average of the prices reported during this period.
- `aggregatedPrices` (integer) - The number of times the price was reported during this period. (See the Rate Updates entity for individual price reports.)

**Notes:**

- Oracles will often update less frequently than shorter timeframe candles (1m, 5m). In these cases, we fill the gap from the previous update with candles where all values are the price of the last oracle update.

### FuturesPosition

The FuturesPosition entity stores the current state of every Synthetix perpetual futures position. A new position is created when a position is opened, and is considered closed when the trader modifies the position to have a `size` of zero or gets liquidated. Cross margin positions are given to the account owner.

- `id` (id) - Unique identifier for this position in the format _market_-_positionId_ where _positionId_ is an incrementing index tracked by the contract.
- `lastTxHash` (bytes) - Transaction hash of the last interaction with this position.
- `openTimestamp` (integer) - UTC timestamp when the position was opened.
- `closeTimestamp` (integer) - UTC timestamp when the position was closed.
- `timestamp` (integer) - UTC timestamp of the last interaction with this position.
- `market` (bytes) - Address of the futures market for this position.
- `asset` (bytes) - A hex encoding of the name of the underlying asset: `sETH` -> `0x...`.
- `account` (bytes) - Address of the account that owns this position. For a cross margin trade, this refers to the account owner.
- `abstractAccount` (bytes) - Address of the account that send the transaction for this position.
- `accountType` (bytes) - `isolated_margin` or `cross_margin` depending on the source of the transaction.
- `isOpen` (boolean) - True if the position is still open.
- `isLiquidated` (boolean) - True if the position was liquidated.
- `trades` (integer) - Count of interactions with this position.
- `totalVolume` (integer) - Total volume in sUSD of all trades made on this position.
- `size` (integer) - Current size of this position in the native asset.
- `initialMargin` (integer) - Amount of margin in sUSD in trader's account when this position was opened.
- `margin` (integer) - Amount of margin in sUSD in the trader's account at the last interaction with this position.
- `pnl` (integer) - Realized profit/loss of this position in sUSD.
- `feesPaid` (integer) - Total fees paid across all trades on this position in sUSD.
- `netFunding` (integer) - Total funding accrued since this position was opened to the trader's last modification.
- `netTransfers` (integer) - Deposits minus withdrawals to the margin account since this position was opened.
- `totalDeposits` (integer) - Total deposits to the margin account since this position was opened.
- `fundingIndex` (integer) - The index in the "funding array" at the last interaction with this position. This value is used to calculate funding each time a trader modifies their position.
- `entryPrice` (integer) - Price of the asset in sUSD when the position was opened.
- `avgEntryPrice` (integer) - Average price in sUSD of the asset across interactions with this position. (note below)
- `lastPrice` (integer) - Price of the asset in sUSD at the last interaction with this position.
- `exitPrice` (integer) - Price of the asset in sUSD when this position was closed.

**Notes:**

- These entities store all futures positions, not just those opened on Kwenta.
- This entity tracks values to the last interaction by the trader (order, margin transfer, trade) but does not include any profit/loss or funding accrued since that interaction.
- There is unrealized funding and pnl that is not stored on these entities. They are a "snapshot" of the position at the last interaction.
- Average entry price is updated when a trader _increases_ their position, or is reset to the entry price when the trader changes sides. For example, if a trader modifies a short position into a long position their new `avgEntryPrice` will be the current price at modification.

### FuturesTrade

The FuturesTrade entity stores each interaction with a futures market where a trader either modifies their position size by submitting an order or is liquidated. Cross margin trades are given to the account owner.

- `id` (id) - Unique identifier for this trade in the format _txnHash_-_logIndex_.
- `timestamp` (integer) - UTC timestamp at the time of this trade.
- `account` (bytes) - Address of the account that made this trade. For a cross margin trade, this refers to the account owner.
- `abstractAccount` (bytes) - Address of the account that send the transaction for this trade.
- `accountType` (bytes) - `isolated_margin` or `cross_margin` depending on the source of the transaction.
- `size` (integer) - Size of the trade in native asset.
- `asset` (bytes) - A hex encoding of the name of the underlying asset: `sETH` -> `0x...`.
- `price` (integer) - Price of the asset in sUSD at the time of this trade.
- `positionId` (id) - See `FuturesPosition.id`.
- `positionSize` (integer) - Resulting position size in the native asset.
- `positionClosed` (boolean) - Flag for whether this position was closed or liquidated during this transaction.
- `pnl` (integer) - Profit/loss in sUSD realized during this trade.
- `feesPaid` (integer) - Fees paid in sUSD during this trade.
- `orderType` (FuturesOrderType) - Type of order submitted that led to this trade: `Market` / `NextPrice` / `Liquidation`.

### FuturesStat

The FuturesStat entity stores all-time activity data for each trader. This includes all profits from cross margin trades made by accounts owned by this account.

- `id` (id) - The address of a trader.
- `account` (bytes) - Same as id.
- `feesPaid` (integer) - Total fees paid in sUSD for all trades.
- `pnl` (integer) - Total profit/loss in sUSD for all trades.
- `pnlWithFeesPaid` (integer) - Total profit/loss in sUSD for all trades net of fees and funding.
- `liquidations` (integer) - Count of the trader's liquidations.
- `totalTrades` (integer) - Count of the trader's trades.
- `totalVolume` (integer) - Total trading volume of the trader in sUSD.

### FuturesCumulativeStat

The FuturesCumulativeStat entity stores all-time activity data for each perp market and all markets in aggregate.

- `id` (id) - The address of the market OR `0` for all markets.
- `totalLiquidations` (integer) - Count of the trader's liquidations.
- `totalTrades` (integer) - Count of the trader's trades.
- `totalTraders` (integer) - Count of unique traders that have deposited margin to this market.
- `totalVolume` (integer) - Total trading volume of the trader in sUSD.
- `averageTradeSize` (integer) - Total volume divided by the number of trades.

### FuturesHourlyStat

The FuturesHourlyStat entity stores hourly activity data for each perp market.

- `id` (id) - The address of the market and the unix timestamp at the beginning of the hour, `-` separated.
- `timestamp` (integer) - Unix timestamp in seconds at the start of this hour.
- `asset` (bytes) - A hex encoding of the name of the underlying asset: `sETH` -> `0x...`.
- `trades` (integer) - Count of trades this hour.
- `volume` (integer) - Total trading volume on this market in sUSD.

### FuturesMarginTransfer

The FuturesMarginTransfer entity stores each deposit or withdrawal of margin between a trader and a futures market.

- `id` (id) - Unique identifier for this transfer in the format _futuresMarketAddress_-_logIndex_.
- `timestamp` (integer) - UTC timestamp when this margin transfer took place.
- `account` (bytes) - Address of the trader that intiated the transfer.
- `market` (bytes) - Address of the futures market which the trader added or removed margin.
- `asset` (bytes) - A hex encoding of the name of the underlying asset: `sETH` -> `0x...`.
- `size` (integer) - The amount in sUSD that the trader added or removed from their margin account.
- `txHash` (string) - Transaction hash of this interaction with the futures market.

### FuturesMarginAccount

The FuturesMarginAccount entity updates every time a user interacts with a market. The entity tracks a snapshot of a users margin account for each market, which enables comparing two snapshots to calculate a trader's realized profit and loss between two blocks.

- `id` (id) - Unique identifier for this margin account in the format _accountAddress_-_marketAddress_.
- `timestamp` (integer) - UTC timestamp of the last interaction with this market.
- `account` (bytes) - Address of the account that opened the position.
- `market` (bytes) - Address of the futures market for this position.
- `asset` (bytes) - A hex encoding of the name of the underlying asset: `sETH` -> `0x...`.
- `margin` (integer) - Amount of margin in sUSD at the time of this interaction.
- `deposits` (integer) - Total amount of deposits to the market in sUSD.
- `withdrawals` (integer) - Total amount of withdrawals from this market in sUSD.

### FuturesOrder

The FuturesOrder entity stores open orders from traders on any market. At this time this includes Next Price orders.

- `id` (id) - Unique identifier for this order in the format _marketAddress_-_accountAddress_-_targetRoundId_.
- `size` (integer) - Size of the order in units of the native asset
- `asset` (bytes) - A hex encoding of the name of the underlying asset: `sETH` -> `0x...`.
- `market` (bytes) - Address of the futures market for this position.
- `account` (bytes) - Address of the account that opened the position.
- `targetRoundId` (integer) - The target round id references the oracle update when this order is eligible to be filled. This value is mostly used by keepers to determine when orders can be filled.
- `timestamp` (integer) - UTC timestamp of the last interaction with this order.
- `orderType` (FuturesOrderType) - Always `NextPrice`.
- `status` (FuturesOrderStatus) - Status of this order, can be: `Pending` / `Filled` / `Cancelled`.
- `keeper` (bytes) - Address of the keeper that executed the order when it is filled.

## Development

### Auth

To set your access token for the hosted service:

`npm run auth <ACCESS_TOKEN>`

### Deployment

To build and deploy the subgraphs, run `npm run deploy` for a CLI. You will have the option to update the Synthetix contract ABIs, build the updated subgraph, and deploy to the hosted service and/or decentralized network.

The CLI automatically generates the main subgraph, which is composed of the other subgraph in the `subgraphs` directory. You can also use the CLI to deploy the component subgraphs to the hosted service for faster development and testing.

All of the prompts in the CLI can be provided via options. For more information, run `npm run deploy -- --help`.

PRs to the `main` branch of this repository will result in deploys of main subgraphs to each network: Optimism mainnet, Optimism kovan, and Ethereum mainnet.

### Codegen

To generate a set of subgraph functions for a frontend, use the following commands but replace the endpoint:

```
npx codegen-graph-ts pull https://api.thegraph.com/subgraphs/name/example-team/example-subgraph > manifest.json
npx codegen-graph-ts gen -s manifest.json -o subgraph.ts
```
