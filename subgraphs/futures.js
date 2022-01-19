const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket',
  network: getCurrentNetwork(),
  source: {
    address: '0xf6cE6160B9d3b8313326f8c9244a5BBf55244069',
    startBlock: 0,
    abi: 'FuturesMarket',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
    language: 'wasm/assemblyscript',
    file: '../src/futures.ts',
    entities: ['FuturesMarket', 'FuturesPosition', 'FuturesTrade'],
    abis: [
      {
        name: 'FuturesMarket',
        file: '../abis/FuturesMarket.json',
      },
    ],
    eventHandlers: [
      {
        event: 'PositionLiquidated(indexed uint256,indexed address,indexed address,int256,uint256,uint256)',
        handler: 'handlePositionLiquidated',
      },
      {
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256)',
        handler: 'handlePositionModified',
      },
    ],
  },
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Futures API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './futures.graphql',
  },
  dataSources: manifest,
};
