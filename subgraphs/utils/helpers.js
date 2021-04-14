const addNetworkData = ({ mainnet, optimism, kovan, 'optimism-kovan': kovanOvm }) => () => (network, render) => {
  if (network === 'mainnet') {
    return render(mainnet);
  } else if (network === 'optimism') {
    return render(optimism);
  } else if (network === 'optimism-kovan') {
    return render(kovanOvm);
  } else if (network === 'kovan') {
    return render(kovan);
  }
};

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
  addAddress: ({ mainnet, optimism, kovan, 'optimism-kovan': kovanOvm }) =>
    addNetworkData({ mainnet, optimism, kovan, 'optimism-kovan': kovanOvm }),
  addStartBlock: ({ mainnet, optimism, kovan, 'optimism-kovan': kovanOvm }) =>
    addNetworkData({
      mainnet: mainnet || '1',
      optimism: optimism || '1',
      kovan: kovan || '1',
      'optimism-kovan': kovanOvm || '1',
    }),
};
