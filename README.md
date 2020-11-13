# Synthetix Subgraph

[![CircleCI](https://circleci.com/gh/Synthetixio/synthetix-subgraph.svg?style=svg)](https://circleci.com/gh/Synthetixio/synthetix-subgraph)

The Graph exposes a GraphQL endpoint to query the events and entities within the Synthetix system.

Synthetix has four bundled subgraps, all generated from this one repository:

![image](https://user-images.githubusercontent.com/799038/79390156-32c93080-7f3d-11ea-812a-34ad3543fc28.png)

1. **Synthetix**: issuing (aka minting) sUSD, burning sUSD and transferring SNX & Synths: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix
2. **Exchanges**: synth Exchange Volume and fees generated: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-exchanges
3. **Rates**: historical rates on-chain for the various synths to USD: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-rates
4. **Depot**: deposits, withdrawls and successful exchanges in the Depot: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-depot
5. **Loans**: loans created and closed using EtherCollateral: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-loans
6. **Binary Options**: Binary options data: https://thegraph.com/explorer/subgraph/synthetixio-team/synthetix-binary-options

## To run and deploy locally

For any of the four subgraphs: `snx`, `exchanges`, `rates`, `depot`, `loans` and `binary-options` as `[subgraph]`

1. Run the `npm run codegen:[subgraph]` task to prepare the TypeScript sources for the GraphQL (generated/schema) and the ABIs (generated/[ABI]/\*)
2. [Optional] run the `npm run build:[subgraph]` task for the subgraph
3. Deploy via `npm run deploy:[subgraph]`. Note: requires env variable of `$THEGRAPH_SNX_ACCESS_TOKEN` set in bash to work.

## To deploy test Rates or Exchanger subgraphs at different start blocks

1. First, you have to udpate the `--env` flag to `test` in `yaml:rates` or `yaml:exchanger` in `package.json` and then it will pick up any changes you make to the test start blocks in `set-start-blocks` file in the relevant subgraph folder inside the `./mustache` folder. If you leave a test block as null it will use the prod block instead.

IMPORTANT: if you just want to use a single start block for all contracts within the rates or exchanger subgraph, simply change the `--universal-test-block` flag in `yaml:rates` or `yaml:exchanger` in `package.json` from `null` to `<number>` and you don't need to make any changes to `set-start-blocks` in that case.

2. Continue from step 2 in the section `To run and deploy locally` above.

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
