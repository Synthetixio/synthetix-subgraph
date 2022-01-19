const { getCurrentNetwork } = require('./utils/network');

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

manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarketManager',
  network: getCurrentNetwork(),
  source: {
    address: '0xd33E996D0A054d4Ef529E3cF8058B7D2906ea107',
    startBlock: 0,
    abi: 'FuturesMarketManager',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
    language: 'wasm/assemblyscript',
    file: '../src/futures.ts',
    entities: ['FuturesMarket'],
    abis: [
      {
        name: 'FuturesMarket',
        file: '../abis/FuturesMarket.json',
      },
      {
        name: 'FuturesMarketManager',
        file: '../abis/FuturesMarketManager.json',
      },
    ],
    eventHandlers: [
      {
        event: 'MarketAdded(address,indexed bytes32)',
        handler: 'handleMarketAdded',
      },
      {
        event: 'MarketRemoved(address,indexed bytes32)',
        handler: 'handleMarketRemoved',
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
