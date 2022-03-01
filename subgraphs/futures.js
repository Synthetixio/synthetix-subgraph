const { getCurrentNetwork } = require('./utils/network');

const manifest = [];

manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket',
  network: getCurrentNetwork(),
  source: {
    address: '0x832177F21CCDcc286003faDF4e98fc11dc5C627F',
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
    address: '0x4BADCe3453810a2EaC9da2352F40239B4F77E25b',
    startBlock: 1265982,
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

// ProxyFuturesMarketBTC
manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket_BTC',
  network: getCurrentNetwork(),
  source: {
    address: '0xaFC817d8B6FcA3a22607384b42A0d26B4eC85d9D',
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
        event: 'MarginTransferred(indexed address,int256)',
        handler: 'handleMarginTransferredBTC',
      },
      {
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256)',
        handler: 'handlePositionModified',
      },
    ],
  },
});

// ProxyFuturesMarketETH
manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket_ETH',
  network: getCurrentNetwork(),
  source: {
    address: '0xE72CFFC7C07aa4FA7E8cB3B19AbD631bf58022b5',
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
        event: 'MarginTransferred(indexed address,int256)',
        handler: 'handleMarginTransferredETH',
      },
      {
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256)',
        handler: 'handlePositionModified',
      },
    ],
  },
});

// ProxyFuturesMarketLINK
manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket_LINK',
  network: getCurrentNetwork(),
  source: {
    address: '0x697eD8b025D5F65591Eda8645A9ee5Db4d1f7b12',
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
        event: 'MarginTransferred(indexed address,int256)',
        handler: 'handleMarginTransferredLINK',
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
