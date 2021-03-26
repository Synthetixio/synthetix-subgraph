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
};
