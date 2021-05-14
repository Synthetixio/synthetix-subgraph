# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

The Graph exposes a GraphQL endpoint to query the events and entities within the Synthetix system.

Synthetix has eleven bundled subgraps, all generated from this one repository:

![image](https://user-images.githubusercontent.com/799038/79390156-32c93080-7f3d-11ea-812a-34ad3543fc28.png)

1. **Synthetix**: issuing (aka minting) sUSD, burning sUSD and transferring SNX & Synths: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix
2. **Exchanges**: synth Exchange Volume and fees generated: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-exchanges
3. **Rates**: historical rates on-chain for the various synths to USD: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-rates
4. **Depot**: deposits, withdrawls and successful exchanges in the Depot: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-depot
5. **Loans**: loans created and closed using EtherCollateral: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-loans
6. **Binary Options**: Binary options data: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-binary-options
7. **Grants DAO**: Grants DAO data: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-grantsdao
8. **Exchanger**: Tracks exchange entries and volume sources: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-exchanger
9. **Liquidations**: Tracks protocol liquidations: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-liquidations
10. **Limit Orders**: Tracks limit orders: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-limit-orders
11. **Chainlink**: Tracks chainlink rates: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-chainlink

## To run and deploy locally

list of networks: `mainnet`, `optimism-mainnet`, `kovan`, `optimism-kovan`, also, `all` deploys to all 4 networks

npm run build <network> <subgraph>
npm run deploy <network> <subgraph>

deploying `synthetix` subgraph examples:

- npm run build mainnet synthetix
- npm run deploy mainnet synthetix

--

- npm run build kovan synthetix
- npm run build kovan synthetix

--

- npm run build optimism-mainnet synthetix
- npm run build optimism-mainnet synthetix

--

- npm run deploy all synthetix
- npm run deploy all synthetix

deploying `synthetix-loans` subgraph examples:

- npm run build mainnet synthetix-loans
- npm run deploy mainnet synthetix-loans

--

- npm run build kovan synthetix-loans
- npm run build kovan synthetix-loans

--

- npm run build optimism-mainnet synthetix-loans
- npm run build optimism-mainnet synthetix-loans

--

- npm run deploy all synthetix-loans
- npm run deploy all synthetix-loans

Replace `synthetix-loans` with the subgraph of your choice in the above commands

## To query these subgraphs

Please use our node & browser utility: [@synthetixio/data](https://github.com/Synthetixio/js-monorepo/tree/master/packages/data).

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

> Note: due to The Graph limitation, only `1000` results will be returned (the maximum allowed `first` amount). If you use the predefined queries in `@synthetixio/data` it will grab all the results unless you pass a `max` field. You can also read the docs for more info on pagination if writing a custom query: https://thegraph.com/docs/graphql-api#pagination
