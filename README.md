# Synthetix Subgraph

Here is the code for Synthetix's current subgraph: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix

The Graph exposes a GraphQL endpoint to query the events and entities within the Synthetix system.

For example:

```javascript
// Fetch all Exchanges in the last 24hrs (uses "fetch" - runs in the browser)
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
        fromAmount,
        fromCurrencyKey,
        toCurrencyKey,
        block,
        timestamp,
        toAddress
      }
    }`,
    variables: null,
  });

  const response = await fetch(graphAPI, {
    method: 'POST',
    body,
  });

  const json = await response.json();
  const { synthExchanges } = json.data;

  // ...
})();
```
