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

// ProxyFuturesMarketBTC
manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket_BTC',
  network: getCurrentNetwork(),
  source: {
    address: '0xce034450a5C59a05abf4d8b4141f839A13fE71BA',
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
    ],
  },
});

// ProxyFuturesMarketETH
manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket_ETH',
  network: getCurrentNetwork(),
  source: {
    address: '0xf2aCEbE185B0BAB0d0d94B7347b92baEE0996288',
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
    ],
  },
});

// ProxyFuturesMarketLINK
manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket_LINK',
  network: getCurrentNetwork(),
  source: {
    address: '0x5c58eC5eb707197362929Ee6ECd160b69881f9d1',
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
