# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

The Graph exposes a GraphQL endpoint to query the events and entities within the Synthetix system.

Synthetix has ten bundled subgraps, all generated from this one repository:

![image](https://user-images.githubusercontent.com/799038/79390156-32c93080-7f3d-11ea-812a-34ad3543fc28.png)

NOTE: replace `mainnet` with `optimism`, `kovan`, or `optimism-kovan` for the other networks

1. **Synthetix**: issuing (aka minting) sUSD, burning sUSD and transferring SNX & Synths: https://thegraph.com/explorer/subgraph/synthetixio-team/general-mainnet
2. **Exchanges**: synth Exchange Volume and fees generated: https://thegraph.com/explorer/subgraph/synthetixio-team/exchanges-mainnet
3. **Rates**: historical rates on-chain for the various synths to USD: https://thegraph.com/explorer/subgraph/synthetixio-team/rates-mainnet
4. **Depot**: deposits, withdrawls and successful exchanges in the Depot: https://thegraph.com/explorer/subgraph/synthetixio-team/depot-mainnet
5. **Loans**: loans created and closed using EtherCollateral: https://thegraph.com/explorer/subgraph/synthetixio-team/loans-mainnet
6. **Binary Options**: Binary options data: https://thegraph.com/explorer/subgraph/synthetixio-team/binary-options-mainnet
7. **Grants DAO**: Grants DAO data: https://thegraph.com/explorer/subgraph/synthetixio-team/grantsdao
8. **Exchanger**: Tracks exchange entries and volume sources: https://thegraph.com/explorer/subgraph/synthetixio-team/exchanger-mainnet
9. **Liquidations**: Tracks protocol liquidations: https://thegraph.com/explorer/subgraph/synthetixio-team/liquidations-mainnet
10. **Limit Orders**: Tracks limit orders: https://thegraph.com/explorer/subgraph/synthetixio-team/limit-orders-mainnet

## To run and deploy locally

list of networks: `mainnet`, `optimism`, `kovan`, `optimism-kovan`, also, `all` deploys to all 4 networks

npm run build <network> <subgraph>
npm run deploy <network> <subgraph>

deploying `general` subgraph examples:

- npm run build mainnet general
- npm run deploy mainnet general

--

- npm run build kovan general
- npm run build kovan general

--

- npm run build optimism general
- npm run build optimism general

--

- npm run deploy all general
- npm run deploy all general

deploying `loans` subgraph examples:

- npm run build mainnet loans
- npm run deploy mainnet loans

--

- npm run build kovan loans
- npm run build kovan loans

--

- npm run build optimism loans
- npm run build optimism loans

--

- npm run deploy all loans
- npm run deploy all loans

Replace `loans` with the subgraph of your choice in the above commands

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
