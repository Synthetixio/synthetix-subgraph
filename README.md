# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

The Graph exposes a GraphQL endpoint to query the events and entities within the Synthetix system.

Synthetix has four bundled subgraps, all generated from this one repository:

1. Minting, Burning and Transferring SNX & Synths: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix
2. Synth Exchange Volume and fees generated: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-exchanges
3. Historical rates on-chain for the various synths to USD: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-rates
4. Depot deposits, withdrawls and successful exchanges: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-depot

## To query these subgraphs

Please use our node & browser utility: [synthetix-data](https://github.com/Synthetixio/synthetix-data).

## Or to query the subgraphs without any JS library

In it's simplest version (on a modern browser assuming `async await` support and `fetch`):

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

  const response = await fetch('https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-exchanges', {
    method: 'POST',
    body,
  });

  const json = await response.json();
  const { synthExchanges } = json.data;
  // ...
  console.log(synthExchanges);
})();
```

> Note: due to The Graph limitation, only `100` results will be returned (the maximum allowed `first` amount). The way around this is to use paging (using the `skip` operator in GraphQL). See the function `pageResults` in [synthetix-data](https://github.com/Synthetixio/synthetix-data/blob/master/index.js) for an example.
