const { getCurrentNetwork, getContractDeployments, getFuturesMarkets } = require('./utils/network');

const synths = getFuturesMarkets(getCurrentNetwork());

const manifest = [];

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
          event: 'MarketAdded(address,indexed bytes32,indexed bytes32)',
          handler: 'handleMarketAdded',
        },
        {
          event: 'MarketRemoved(address,indexed bytes32,indexed bytes32)',
          handler: 'handleMarketRemoved',
        },
      ],
    },
  });
});

// futures markets
synths.forEach((synth, i) => {
  getContractDeployments(`FuturesMarket${synth}`).forEach((a, i) => {
    manifest.push({
      kind: 'ethereum/contract',
      name: `futures_FuturesMarket_${synth}_${i}`,
      network: getCurrentNetwork(),
      source: {
        address: a.address,
        startBlock: a.startBlock,
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
    });
  });
});

// crossmargin
// addresses
TESTNET_CROSSMARGIN_ADDRESS = '0xB2e8d9832C8a22C6fB6D2c92c7E2a69d654749CB';
MAINNET_CROSSMARGIN_ADDRESS = '';

// set up
const crossMarginAddress =
  getCurrentNetwork() === 'optimism-main' ? MAINNET_CROSSMARGIN_ADDRESS : TESTNET_CROSSMARGIN_ADDRESS;

manifest.push({
  kind: 'ethereum/contract',
  name: `crossmargin_factory`,
  network: getCurrentNetwork(),
  source: {
    address: crossMarginAddress,
    startBlock: 0,
    abi: 'MarginAccountFactory',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
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

module.exports = {
  specVersion: '0.0.2',
  description: 'Kwenta Futures API',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './futures.graphql',
  },
  dataSources: manifest,
};
