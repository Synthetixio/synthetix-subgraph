const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

getContractDeployments('BinaryOptionMarketManager').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `BinaryOptionMarketManager_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'BinaryOptionMarketManager',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/binary-options.ts',
      entities: ['Market'],
      abis: [
        {
          name: 'BinaryOptionMarketManager',
          file: '../abis/BinaryOptionMarketManager.json',
        },
        {
          name: 'BinaryOptionMarket',
          file: '../abis/BinaryOptionMarket.json',
        },
      ],
      eventHandlers: [
        {
          event: 'MarketCreated(address,indexed address,indexed bytes32,uint256,uint256,uint256,uint256)',
          handler: 'handleNewMarket',
        },
        {
          event: 'MarketExpired(address)',
          handler: 'handleMarketExpired',
        },
        {
          event: 'MarketCancelled(address)',
          handler: 'handleMarketCancelled',
        },
      ],
    },
  });
});

const templates = [
  {
    kind: 'ethereum/contract',
    name: 'BinaryOptionMarket',
    network: getCurrentNetwork(),
    source: {
      abi: 'BinaryOptionMarket',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/binary-options.ts',
      entities: ['Market', 'OptionTransaction', 'HistoricalOptionPrice'],
      abis: [
        {
          name: 'BinaryOptionMarket',
          file: '../abis/BinaryOptionMarket.json',
        },
      ],
      eventHandlers: [
        {
          event: 'Bid(uint8,indexed address,uint256)',
          handler: 'handleNewBid',
        },
        {
          event: 'Refund(uint8,indexed address,uint256,uint256)',
          handler: 'handleNewRefund',
        },
        {
          event: 'PricesUpdated(uint256,uint256)',
          handler: 'handleNewPricesUpdate',
        },
        {
          event: 'MarketResolved(uint8,uint256,uint256,uint256,uint256,uint256)',
          handler: 'handleMarketResolved',
        },
        {
          event: 'OptionsClaimed(indexed address,uint256,uint256)',
          handler: 'handleOptionsClaimed',
        },
        {
          event: 'OptionsExercised(indexed address,uint256)',
          handler: 'handleOptionsExercised',
        },
      ],
    },
  },
];

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Binary Options API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './binary-options.graphql',
  },
  dataSources: manifest,
  templates: templates,
};
