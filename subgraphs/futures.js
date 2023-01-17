const { getCurrentNetwork, getContractDeployments } = require('./utils/network');

const manifest = [];

// constants
// addresses
OP_MAINNET_CROSSMARGIN_ADDRESS = '0x8e43BF1910ad1461EEe0Daca10547c7e6d9D2f36';
OP_GOERLI_CROSSMARGIN_ADDRESS = '0x9320170B37eDEb4f41cb6E5A8F82B984aD9c44eE';

START_BLOCK_OP_MAINNET = 30657407;
START_BLOCK_OP_GOERLI = 2172242;

GRAFT_BLOCK_OP_MAINNET = 66271334;
GRAFT_BLOCK_OP_GOERLI = 4254066;

GRAFT_BASE_OP_MAINNET = 'QmZydEAXDYbNyRzhbDGdg5D47Wv5R99D2jDyf9fYZrqrXH';
GRAFT_BASE_OP_GOERLI = 'QmbguxdYpf1GKSYdcRjMJuNTtMH7jafbwVa5E3S6mnW8V6';

// calculated variables
const currentNetwork = getCurrentNetwork();
const crossMarginAddress =
  currentNetwork === 'optimism'
    ? OP_MAINNET_CROSSMARGIN_ADDRESS
    : currentNetwork === 'optimism-goerli'
    ? OP_GOERLI_CROSSMARGIN_ADDRESS
    : OP_GOERLI_CROSSMARGIN_ADDRESS;

const crossMarginStartBlock =
  currentNetwork === 'optimism'
    ? START_BLOCK_OP_MAINNET
    : currentNetwork === 'optimism-goerli'
    ? START_BLOCK_OP_GOERLI
    : 0;

const graftBlock =
  currentNetwork === 'optimism'
    ? GRAFT_BLOCK_OP_MAINNET
    : currentNetwork === 'optimism-goerli'
    ? GRAFT_BLOCK_OP_GOERLI
    : null;

const graftBase =
  currentNetwork === 'optimism'
    ? GRAFT_BASE_OP_MAINNET
    : currentNetwork === 'optimism-goerli'
    ? GRAFT_BASE_OP_GOERLI
    : null;

// futures market manager
getContractDeployments('FuturesMarketManager').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `futures_FuturesMarketManager_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'FuturesMarketManager',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.6',
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
          event: 'MarketAdded(address,indexed bytes32,indexed bytes32)',
          handler: 'handleV1MarketAdded',
        },
        {
          event: 'MarketRemoved(address,indexed bytes32,indexed bytes32)',
          handler: 'handleMarketRemoved',
        },
      ],
    },
  });
});

// futures v1 markets
const futuresMarketTemplate = {
  kind: 'ethereum/contract',
  name: 'FuturesMarket',
  network: getCurrentNetwork(),
  source: {
    abi: 'FuturesMarket',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
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
        handler: 'handleMarginTransferred',
      },
      {
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256)',
        handler: 'handlePositionModified',
      },
      {
        event: 'PositionLiquidated(indexed uint256,indexed address,indexed address,int256,uint256,uint256)',
        handler: 'handlePositionLiquidated',
      },
      {
        event: 'FundingRecomputed(int256,uint256,uint256)',
        handler: 'handleFundingRecomputed',
      },
      {
        event: 'NextPriceOrderSubmitted(indexed address,int256,uint256,uint256,uint256,bytes32)',
        handler: 'handleNextPriceOrderSubmitted',
      },
      {
        event: 'NextPriceOrderRemoved(indexed address,uint256,int256,uint256,uint256,uint256,bytes32)',
        handler: 'handleNextPriceOrderRemoved',
      },
    ],
  },
};

// crossmargin
manifest.push({
  kind: 'ethereum/contract',
  name: 'crossmargin_factory',
  network: getCurrentNetwork(),
  source: {
    address: crossMarginAddress,
    startBlock: crossMarginStartBlock,
    abi: 'MarginAccountFactory',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/crossmargin.ts',
    entities: ['MarginAccountFactory'],
    abis: [
      {
        name: 'MarginAccountFactory',
        file: '../abis/MarginAccountFactory.json',
      },
    ],
    eventHandlers: [
      {
        event: 'NewAccount(indexed address,address)',
        handler: 'handleNewAccount',
      },
    ],
  },
});

const marginBaseTemplate = {
  kind: 'ethereum/contract',
  name: 'MarginBase',
  network: getCurrentNetwork(),
  source: {
    abi: 'MarginBase',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/crossmargin.ts',
    entities: ['MarginBase'],
    abis: [
      {
        name: 'MarginBase',
        file: '../abis/MarginBase.json',
      },
    ],
    eventHandlers: [],
  },
};

// perps v2 markets
const perpsMarketTemplate = {
  kind: 'ethereum/contract',
  name: 'PerpsMarket',
  network: getCurrentNetwork(),
  source: {
    abi: 'PerpsV2MarketProxyable',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/futures.ts',
    entities: ['FuturesMarket', 'FuturesPosition', 'FuturesTrade'],
    abis: [
      {
        name: 'PerpsV2MarketProxyable',
        file: '../abis/PerpsV2MarketProxyable.json',
      },
    ],
    eventHandlers: [
      {
        event: 'MarginTransferred(indexed address,int256)',
        handler: 'handleMarginTransferred',
      },
      {
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256)',
        handler: 'handlePositionModified',
      },
      {
        event: 'PositionLiquidated(uint256,address,address,int256,uint256,uint256)',
        handler: 'handlePositionLiquidated',
      },
      {
        event: 'DelayedOrderSubmitted(indexed address,bool,int256,uint256,uint256,uint256,uint256,uint256,bytes32)',
        handler: 'handleDelayedOrderSubmitted',
      },
      {
        event: 'DelayedOrderRemoved(indexed address,bool,uint256,int256,uint256,uint256,uint256,bytes32)',
        handler: 'handleDelayedOrderRemoved',
      },
    ],
  },
};

const graftConfig =
  graftBase && graftBase
    ? {
        graft: {
          base: graftBase,
          block: graftBlock,
        },
        features: ['grafting'],
      }
    : {};

module.exports = {
  specVersion: '0.0.4',
  description: 'Kwenta Futures API',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './futures.graphql',
  },
  ...graftConfig,
  dataSources: manifest,
  templates: [marginBaseTemplate, futuresMarketTemplate, perpsMarketTemplate],
};
