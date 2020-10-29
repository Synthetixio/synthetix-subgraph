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

## To deploy the Rates or Exchanger subgraphs locally at specific start blocks for testing purposes

1. Set the specific start blocks for the test subgraph:

- To modify the start block for all contracts within a subgraph to be the same, simply change the UNIVERSAL_START_BLOCK in `package.json` from null to a number for the relevant subgraph and make sure to run that specific test command in step 2.

- To modify individual contracts for the rates subgraph to have different start blocks from prod when testing: go to `mustache/templates/rates/data-sources.js` and modify the `testStartBlock` field for each contract in the `createStartBlock` method.

- To modify individual contracts for the exchanger subgraph to have different start blocks from prod when testing: edit the rates contracts starting blocks used in the exchanger subgraph by modifying the `testStartBlock` in the `mustache/templates/exchanger/rates-differences.js` file. You can also modify the exchanger specific starting blocks in the `mustache/templates/exchanger/data-sources.js` file.

2. Run the command `npm run codegen:rates:test` or `npm run codegen:exchanger:test` to activate the starting blocks you changed above. Using npm run codegen:rates will always use the prod block from the `createStartBlock` method.

3. Continue from step 2 in the section `To run and deploy locally` above.

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
