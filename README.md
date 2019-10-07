# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

The Graph exposes a GraphQL endpoint to query the events and entities within the Synthetix system.

Synthetix has three bundled subgraps, all generated from this one repository:

1. Minting, Burning and Transferring SNX & Synths: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix
2. Synth Exchange Volume and fees generated: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-exchanges
3. Historical rates on-chain for the various synths to USD

## How to query via the npm library (CLE)

```bash
# get last 24 hours of exchange activity, ordered from latest to earliest
npx synthetix-subgraph exchanges.since
```

## Use as a module dependency

```javascript
const snxData = require('synthetix-subgraph');

snxData.exchanges.since().then(exchnages => console.log(exchanges));
```

## Use in a browser

```html
<script src="//cdn.jsdelivr.net/npm/synthetix-subgraph/index.js"></script>
<script>
  window.snxData.exchanges.since().then(console.log);
</script>
```

## Use without this librarys

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
        fromCurrencyKey
        toCurrencyKey
        block
        timestamp
        toAddress
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
