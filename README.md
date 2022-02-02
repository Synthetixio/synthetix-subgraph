# Synthetix Subgraph

## Overview

[The Graph](https://thegraph.com/) is a decentralized protocol for indexing and querying data on the Ethereum blockchain. Subgraphs define the data The Graph will index and how it will be stored. This data is then provided via a GraphQL API.

The Graph currently consists of a hosted service and a decentralized network. In the future, the hosted service will be gradually sunset after the decentralized network achieves feature parity.

Synthetix currently maintains one official subgraph per network. Only mainnet is on The Graph’s decentralized network.

### Hosted Service

The Synthetix subgraph is available on the hosted service on **[mainnet](https://thegraph.com/hosted-service/subgraph/synthetixio-team/mainnet-main)**, **[optimism](https://thegraph.com/hosted-service/subgraph/synthetixio-team/optimism-main)**, **[kovan](https://thegraph.com/hosted-service/subgraph/synthetixio-team/kovan-main)**, and **[optimism-kovan](https://thegraph.com/hosted-service/subgraph/synthetixio-team/optimism-kovan-main)**

**⚠️ Using subgraphs with the hosted service may introduce breaking changes.** The Synthetix subgraphs are under active development. Because The Graph does not currently support pinning subgraph versions on the hosted service, these subgraphs should be used with caution.

Note that data queried from the Optimism networks may be incomplete due the regenesis on 11/11/21.

### The Graph Network

The subgraph can also be found on The Graph’s decentralized network **[here](https://thegraph.com/explorer/subgraph?id=0xde910777c787903f78c89e7a0bf7f4c435cbb1fe-0&view=Overview)**.

The decentralized network supports pinning versions. Subgraphs on the decentralized network can only query data on mainnet.

## Usage

### Query the hosted service directly

This code snippet demonstrates how to retrieve all exchanges that occured in the last 24 hours:

```javascript
(async () => {
  const ts = Math.floor(Date.now() / 1e3);
  const oneDayAgo = ts - 3600 * 24;
  const body = JSON.stringify({
    query: `{
      synthExchanges(
        orderBy:timestamp,
        orderDirection:desc,
        where:{timestamp_gt: ${oneDayAgo}}
      )
      {
        fromAmount
        fromAmountInUSD
        fromCurrencyKey
        toCurrencyKey
        block
        timestamp
        toAddress
        toAmount
        toAmountInUSD
        feesInUSD
      }
    }`,
    variables: null,
  });

  const response = await fetch('https://api.thegraph.com/subgraphs/name/synthetixio-team/mainnet-main', {
    method: 'POST',
    body,
  });

  const json = await response.json();
  const { synthExchanges } = json.data;
  // ...
  console.log(synthExchanges);
})();
```

Explore all of the entities available in the subgraph in [the playground](https://thegraph.com/hosted-service/subgraph/synthetixio-team/mainnet-main?selected=playground).

_Due to limitation imposed by The Graph, only 1,000 results will be returned from the query above. Review [The Graph's documentation on pagination](https://thegraph.com/docs/graphql-api#pagination) for more information._

### @synthetixio/queries

[@synthetixio/queries](https://github.com/Synthetixio/js-monorepo/tree/master/packages/queries) is a JavaScript library that retrieves Synthetix’s data from The Graph. The library provides TypeScript support for the returned data, automatically handles pagination, and allows you to subscribe to real-time updates.

## Subgraph Entities

Find detailed documentation for the more commonly accessed subgraph entities below.

### Candle

The Candle entity stores data pertaining to the price of the SNX token and each synth, as reported by Chainlink oracles, over various time periods. This contains all of the data necessary to generate candlestick charts.

- `id` (string) - The unique identifier for this candle, represented as _synth_-_period_-_periodId_. (_periodId_ is calculated by dividing the current timestamp by the period.)
- `synth` (string) - The ticker symbol for synth (e.g. sUSD) or SNX.
- `period` (integer) - The duration this candle is tracking, in seconds. The following periods are available: year (31556736), quarter (7889184), month (2629728), week (604800), day (86400), hour (3600), and 15 minutes (900).
- `open` (decimal) - The price reported at the beginning of this period.
- `high` (decimal) - The highest price reported during this period.
- `low` (decimal) - The lowest price reported during this period.
- `close` (decimal) - The price reported at the end of this period.
- `timestamp` (integer) - The timestamp, in seconds, at the beginning of this period.
- `average` (decimal) - The average of the prices reported during this period.
- `aggregatedPrices` (integer) - The number of times the price was reported during this period. (See the Rate Updates entity for individual price reports.)

### SynthExchange

Each time a synth is exchanged, a new SynthExchange entity is created.

- `id` (string) - The unique identifier for this exchange, represented as _transactionHash_-_eventLogIndex_.
- `account` (Exchanger) - The account that executed the exchange.
- `fromSynth` (Synth) - The synth being exchanged.
- `toSynth` (Synth) - The synth being received in the exchange.
- `fromAmount` (decimal) - The amount of synths being exchanged.
- `fromAmountInUSD` (decimal) - The value of synths being exchanged, denominated in USD at the price of the synths at the time of exchange.
- `toAmount` (decimal) - The amount of synths being received.
- `toAmountInUSD` (decimal) - The value of synths being received, denominated in USD at the price of the synths at the time of exchange.
- `feesInUSD` (decimal) - The fees collected by the protocol for this exchange, denominated in USD.
- `toAddress` (bytes) - The address of the synth being received in the exchange.
- `timestamp` (integer) - The timestamp, in seconds, when this exchange occured.
- `gasPrice` (integer) - The gas price for the exchange.

### Total

The Total entities aggregate SynthExchange data over time.

- `id` (string) - The unique identifier for this total, represented as _timestamp_-_period_-_bucketMagnitude_-_synth_
- `period` (integer) - The duration this candle is tracking, in seconds. The following periods are available: year (31556736), quarter (7889184), month (2629728), week (604800), day (86400), 15 minutes (900), and all-time (0). This is especially useful for filtering.
- `timestamp` (integer) - The timestamp, in seconds, at the beginning of this period. This is especially useful for filtering.
- `bucketMagnitude` (integer) - The minimum power of 10 that the exchange's `fromAmountInUSD` value must be. (e.g. 2 will total trades valued at $100 or higher.) This is especially useful for filtering.
- `synth` (Synth) - The synth being exchanged. This is especially useful for filtering.
- `trades` (integer) - The number of individual exchanges completed in this Total.
- `exchangers` (integer) - The number of unique exchangers who were seen in this Total.
- `newExchangers` (integer) - The number of exchangers who were first seen in this Total.
- `exchangeUSDTally` (decimal) - The value of all synths exchanged, denominated in USD, in this Total.
- `totalFeesGeneratedInUSD` (decimal) - The value of all exchange fees, denominated in USD, generated in this Total.

### SnxHolder

This entity represents each individual holder of SNX tokens.

- `id` (string) - The user's address.
- `block` (integer) - The number of the last block where an event from this user updated this entity.
- `timestamp` (integer) - The timestamp, in second, of the last block where an event from this user updated this entity.
- `balanceOf` (decimal) - The current balance of SNX tokens held by this user.
- `collateral` (decimal) - The amount of SNX which is being used for collateral as of last event and cannot be spent
- `transferable` (decimal) - The amount of SNX which can be spent as of the last event.
- `initialDebtOwnership` (integer) - The percentage of the total debt owned at the time of issuance. This number is modified by the global debt delta array. You can figure out a user's exit price and collateralization ratio using a combination of their initial debt and the slice of global debt delta which applies to them.
- `debtEntryAtIndex` (integer) - An index which lets us know when (in relative terms) the user entered the debt pool so we can calculate their exit price and collateralization ratio.
- `claims` (integer) - The number of fee claims performed by this user.
- `mints` (integer) - The number of mints performed by this user.

## Build and Deploy

To build and deploy the subgraphs, run `npm run deploy` for a CLI. You will have the option to update the Synthetix contract ABIs, build the updated subgraph, and deploy to the hosted service and/or decentralized network.

The CLI automatically generates the main subgraph, which is composed of the other subgraph in the `subgraphs` directory. You can also use the CLI to deploy the component subgraphs to the hosted service for faster development and testing.

All of the prompts in the CLI can be provided via options. For more information, run `npm run deploy -- --help`.
