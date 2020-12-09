To publish the chainlink subgraph you need to run `npm run codegen:chainlink` followed by `npm run build:chainlink` and then `npm run deploy:chainlink`.

If you want to modify the start blocks to all start at a single block for faster testing, you have to modify `npm run yaml:chainlink` command and set`--env test --universal-test-block 111111111` replace `111111111` with the block you want the contracts to start from.

If you want to add new chainlink contracts that are not being tracked by Synthetix you need to do 2 things. First, add the contract related data to the `contracts` file array here. The format we are using for other contract files are like this:

```
  {
    " this is the start block "
    prod: 7626469,

    " you can change a single test start block instead of having a universal block but that is less useful for a larger subgraph like chainlink since it won't help much. Still if you change this you have to set the `--env test` flag in `npm run yaml:chainlink as well "
    test: null,

    " the name of the contract - must be unique in the yaml "
    name: 'ExchangeRates_v231',

    " the contract address must be in this format "
    address: "'0xba34e436C9383aa8FA1e3659D2807ae040592498'",

    " you will need a new type for each similar contract "
    type: '...some-type...',
  },
```

The type that you create will then need a method in the `create-yaml` file that will format it properly like the current `createAggregatorBlock` method does. If chainlink needs to capture data with different settings it is probably idea to create a new type and funnel all the contracts with those types through their own methods similar to `createAggregatorBlock`.
