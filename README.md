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

## Build and Deploy

To build and deploy the subgraphs, run `npm run deploy` for a CLI. You will have the option to update the Synthetix contract ABIs, build the updated subgraph, and deploy to the hosted service and/or decentralized network.

The CLI automatically generates the main subgraph, which is composed of the other subgraph in the `subgraphs` directory. You can also use the CLI to deploy the component subgraphs to the hosted service for faster development and testing.

All of the prompts in the CLI can be provided via options. For more information, run `npm run deploy -- --help`.
