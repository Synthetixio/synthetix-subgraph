const { getCurrentNetwork } = require('./utils/network');

const manifest = [];

manifest.push({
  kind: 'ethereum/contract',
  name: 'futures_FuturesMarket',
  network: getCurrentNetwork(),
  source: {
    address: '0xC51aeDBEC3aCD26650a7E85B6909E8AEc4d0F19e',
    startBlock: 1265982,
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
    address: '0xc704c9AA89d1ca60F67B3075d05fBb92b3B00B3B',
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
    address: '0xEe8804d8Ad10b0C3aD1Bd57AC3737242aD24bB95',
    startBlock: 1265982,
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
    address: '0xf86048DFf23cF130107dfB4e6386f574231a5C65',
    startBlock: 1265982,
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
    address: '0x1228c7D8BBc5bC53DB181bD7B1fcE765aa83bF8A',
    startBlock: 1265982,
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
