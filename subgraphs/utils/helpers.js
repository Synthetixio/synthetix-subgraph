module.exports = {
  createAggregatorBlock: ({ feed, aggregator }) => ({
    name: feed,
    mappingFile: './src/mapping.ts',
    address: aggregator,
    abi: 'Aggregator',
    entities: ['AggregatorAnswer'],
    abis: [
      {
        name: 'Aggregator',
        path: './abis/Aggregator.json',
      },
      {
        name: 'ExchangeRates',
        path: './abis/ExchangeRates.json',
      },
      {
        name: 'AddressResolver',
        path: './abis/AddressResolver.json',
      },
    ],
    events: [
      {
        event: 'AnswerUpdated(indexed int256,indexed uint256,uint256)',
        handler: 'handleAggregatorAnswerUpdated',
      },
    ],
  }),
  addNetworkData: ({ mainnet, optimism, kovan, kovanOvm, startBlock }) => () => (network, render) => {
    if (network === 'mainnet') {
      return render(mainnet || startBlock);
    } else if (network === 'optimism') {
      return render(optimism || startBlock);
    } else if (network === 'kovan-optimism') {
      return render(kovan || startBlock);
    } else if (network === 'kovan') {
      return render(kovanOvm || startBlock);
    }
  },
};
