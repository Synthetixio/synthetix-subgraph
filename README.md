# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

## Overview

[The Graph](https://thegraph.com/) is a decentralized protocol for indexing and querying data. Subgraphs define the data The Graph will index and how it will be stored. This data is then provided via a GraphQL API.

The Graph currently consists of a hosted service and a decentralized network. In the future, the hosted service will be gradually sunset after the decentralized network achieves feature parity.

Synthetix currently publishes its subgraph to the hosted service and the decentralized network.

### Hosted Service

The Synthetix subgraph is available on the hosted service on **[mainnet]()**, **[optimism]()**, **[kovan]()**, and **[optimism-kovan]()**

**⚠️ Using subgraphs with the hosted service may introduce breaking changes.** The Synthetix subgraphs are under active development. Because The Graph does not currently support pinning subgraph versions on the hosted service, these subgraphs should be used with caution.

### The Graph Network

The subgraph can also be found on The Graph’s decentralized network **[here](https://thegraph.com/explorer/subgraph?id=0xde910777c787903f78c89e7a0bf7f4c435cbb1fe-0&view=Overview)**.

The decentralized network supports pinning versions. Subgraphs on the decentralized network can only query data on mainnet currently.

## Usage

### synthetix-data

To abstract interacting with The Graph’s hosted service directly, Synthetix maintains a JavaScript library: [synthetix-data](https://github.com/Synthetixio/js-monorepo/tree/master/packages/data). The library provides TypeScript support for the returned data and allows you to subscribe to real-time updates.

### Query the hosted service directly

Here’s an example of ...

```javascript
// Fetch all Exchanges in the last 24hrs s
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

  const response = await fetch('https://api.thegraph.com/subgraphs/name/synthetixio-team/exchanges', {
    method: 'POST',
    body,
  });

  const json = await response.json();
  const { synthExchanges } = json.data;
  // ...
  console.log(synthExchanges);
})();
```

> Note: due to The Graph limitation, only `1000` results will be returned (the maximum allowed `first` amount). If you use the predefined queries in `@synthetixio/data` it will grab all the results unless you pass a `max` field. You can also read the docs for more info on pagination if writing a custom query: https://thegraph.com/docs/graphql-api#pagination

## Build and Deploy

To build and deploy the subgraphs, run `npm run deploy` for the CLI. You will have the option to update the Synthetix contract ABIs, build the updated subgraph, and deploy to the hosted service and/or decentralized network.

The CLI automatically generates the main subgraph, which is composed of the other subgraph in the `subgraphs` directory. You can also use the CLI to deploy the component subgraphs to the hosted service for faster development and testing.

All of the prompts in the CLI can be provided via options. For more information, run `npm run deploy -- --help`.
