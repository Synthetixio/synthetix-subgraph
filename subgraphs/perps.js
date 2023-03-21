const { getCurrentNetwork, getContractDeployments } = require('./utils/network');

const manifest = [];

// get config
const currentNetwork = getCurrentNetwork();

const mainnetConfig = {
  managerStartBlock: 52456507,
  smartMarginFactoryAddress: '0xa5Aac6b5De821E631C7Ad01f978e32e80a8461c7',
  smartMarginFactoryStartBlock: 78921742,
  smartMarginEventsAddress: '0x319Ae7F3a0D635eD9CCF0276dCeAF680F9C7c397',
  smartMarginEventsStartBlock: 78921720,
};

const testnetConfig = {
  managerStartBlock: 3495320,
  smartMarginFactoryAddress: '0xfc026f2230C55DC8BDE3bD9bE8941fbDCA6B39C2',
  smartMarginFactoryStartBlock: 6434063,
  smartMarginEventsAddress: '0x78016932540193e2E80683B8F9Be222729eF08D4',
  smartMarginEventsStartBlock: 6434056,
};

const config = currentNetwork === 'optimism' ? mainnetConfig : testnetConfig;

// futures market manager
getContractDeployments('FuturesMarketManager').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `futures_FuturesMarketManager_${i}`,
    network: currentNetwork,
    source: {
      address: a.address,
      startBlock: config.managerStartBlock,
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
          handler: 'handleV2MarketAdded',
        },
        {
          event: 'MarketRemoved(address,indexed bytes32,indexed bytes32)',
          handler: 'handleMarketRemoved',
        },
      ],
    },
  });
});

// perps v2 markets
const perpsMarketTemplate = {
  kind: 'ethereum/contract',
  name: 'PerpsMarket',
  network: currentNetwork,
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
      {
        event: 'FundingRecomputed(int256,int256,uint256,uint256)',
        handler: 'handleFundingRecomputed',
      },
    ],
  },
};

// smart margin
manifest.push({
  kind: 'ethereum/contract',
  name: 'smartmargin_factory',
  network: getCurrentNetwork(),
  source: {
    address: config.smartMarginFactoryAddress,
    startBlock: config.smartMarginFactoryStartBlock,
    abi: 'Factory',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/smartmargin.ts',
    entities: ['Factory'],
    abis: [
      {
        name: 'Factory',
        file: '../abis/Factory.json',
      },
    ],
    eventHandlers: [
      {
        event: 'NewAccount(indexed address,indexed address,bytes32)',
        handler: 'handleNewAccount',
      },
    ],
  },
});

module.exports = {
  specVersion: '0.0.4',
  description: 'Kwenta Futures API',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './futures.graphql',
  },
  dataSources: manifest,
  templates: [perpsMarketTemplate],
};
