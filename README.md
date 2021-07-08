# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

![image](https://user-images.githubusercontent.com/799038/79390156-32c93080-7f3d-11ea-812a-34ad3543fc28.png)

The Graph exposes GraphQL endpoints to query events and entities from the Synthetix contracts built on the Ethereum and Optimism networks.

Synthetix has 13 bundled subgraps on mainnet, and most of these subgraphs also have mirrored endpoints that point to similar activity on the `optimism`, `kovan`, and `optimism-kovan` networks. Below is a table outlining which subgraph is available on each network:

| Subgraph            | Description                                                            | Networks & Links                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **General**         | issuing (aka minting) sUSD, burning sUSD and transferring SNX & Synths | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-general), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-general), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-general), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-general)                             |
| **Exchanges**       | synth Exchange Volume and fees generated                               | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-exchanges), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-exchanges), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-exchanges), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-exchanges)                     |
| **Rates**           | historical rates on-chain for the various synths to USD                | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-rates), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-rates), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-rates), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-rates)                                     |
| **Depot**           | deposits, withdrawls and successful exchanges in the Depot             | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-depot), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-depot), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-depot), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-depot)                                     |
| **Loans**           | loans created and closed using EtherCollateral                         | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-loans), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-loans), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-loans), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-loans)                                     |
| **Binary Options**  | Binary options data                                                    | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-binary-options), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-binary-options), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-binary-options), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-binary-options) |
| **Grants DAO**      | Grants DAO data (historical and only on mainnet)                       | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/grantsdao)                                                                                                                                                                                                                                                                                                           |
| **Exchanger**       | Tracks exchange entries and volume sources                             | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-exchanger), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-exchanger), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-exchanger), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-exchanger)                     |
| **Liquidations**    | Tracks protocol liquidations                                           | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-liquidations), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-liquidations), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-liquidations), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-liquidations)         |
| **Shorts**          | Tracks shorts in Synthetix                                             | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-shorts), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-shorts), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-shorts), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-shorts)                                 |
| **Optimism Bridge** | Tracks Mainnet deposits to Optimism                                    | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-optimism-bridge)                                                                                                                                                                                                                                                                                             |
| **Delegation**      | Tracks which wallets have been authorised for delegation               | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-delegation), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-delegation), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-delegation), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-delegation)                 |
| **Global Debt**     | Tracks global debt in Synthetix protocol                               | [Mainnet](https://thegraph.com/explorer/subgraph/synthetixio-team/mainnet-global-debt), [Optimism](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-global-debt), [Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/kovan-global-debt), [Optimism-Kovan](https://thegraph.com/explorer/subgraph/synthetixio-team/optimism-kovan-global-debt)             |

<br></br>

## To run and deploy subgraphs

First you need to get the API key from the Synthetix core contributors who manage access to the subgraphs. Once you have this key stored under $THEGRAPH_SNX_ACCESS_TOKEN you may continue.

The list of supported networks is: `mainnet`, `optimism`, `kovan`, `optimism-kovan`; also, `all` deploys to all 4 networks. The following 2 commands will build and deploy a subgraph:

- npm run build $network $subgraph
- npm run deploy $network $subgraph

Example 1: deploying `general` subgraph:

- npm run build mainnet general
- npm run deploy mainnet general

--

- npm run build kovan general
- npm run deploy kovan general

--

- npm run build optimism general
- npm run deploy optimism general

--

- npm run build all general
- npm run deploy all general

Example 2: deploying `loans` subgraph:

- npm run build mainnet loans
- npm run deploy mainnet loans

--

- npm run build kovan loans
- npm run deploy kovan loans

--

- npm run build optimism loans
- npm run deploy optimism loans

--

- npm run build all loans
- npm run deploy all loans

Example 3+: Replace `loans` with the subgraph of your choice in the above commands

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
