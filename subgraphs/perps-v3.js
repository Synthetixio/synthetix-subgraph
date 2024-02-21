const { getCurrentNetwork } = require('./utils/network');

const manifest = [];

// get config
const currentNetwork = getCurrentNetwork();

const mainnetConfig = {
  marketProxy: {
    address: '0x0A2AF931eFFd34b81ebcc57E3d3c9B1E1dE1C9Ce',
    startBlock: 4382,
  },
};

const sepoliaConfig = {
  marketProxy: {
    address: '0xE6C5f05C415126E6b81FCc3619f65Db2fCAd58D0',
    startBlock: 4548969,
  },
};

const config = currentNetwork === 'base' ? mainnetConfig : sepoliaConfig;

manifest.push({
  kind: 'ethereum/contract',
  name: 'PerpsV3',
  network: currentNetwork,
  source: {
    address: config.marketProxy.address,
    abi: 'PerpsV3MarketProxy',
    startBlock: config.marketProxy.startBlock,
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/perps-v3.ts',
    entities: ['Account', 'OrderSettled', 'DelegatedAccount'],
    abis: [
      {
        name: 'PerpsV3MarketProxy',
        file: '../abis/PerpsV3MarketProxy.json',
      },
    ],
    eventHandlers: [
      {
        event: 'AccountCreated(indexed uint128,indexed address)',
        handler: 'handleAccountCreated',
      },
      {
        event:
          'OrderSettled(indexed uint128,indexed uint128,uint256,int256,int256,int128,int128,uint256,uint256,uint256,uint256,indexed bytes32,address)',
        handler: 'handleOrderSettled',
      },
      {
        event: 'MarketCreated(indexed uint128,string,string)',
        handler: 'handleMarketCreated',
      },
      {
        event: 'PositionLiquidated(indexed uint128,indexed uint128,uint256,int128)',
        handler: 'handlePositionLiquidated',
      },
      {
        event:
          'SettlementStrategyAdded(indexed uint128,(uint8,uint256,uint256,address,bytes32,uint256,bool,uint256),indexed uint256)',
        handler: 'handleSettlementStrategyAdded',
      },
      {
        event:
          'SettlementStrategySet(indexed uint128,indexed uint256,(uint8,uint256,uint256,address,bytes32,uint256,bool,uint256))',
        handler: 'handleSettlementStrategyEnabled',
      },
      {
        event: 'MarketUpdated(uint128,uint256,int256,uint256,int256,int256,int256)',
        handler: 'handleMarketUpdated',
      },
      {
        event: 'PermissionGranted(indexed uint128,indexed bytes32,indexed address,address)',
        handler: 'handlePermissionGranted',
      },
      {
        event: 'PermissionRevoked(indexed uint128,indexed bytes32,indexed address,address)',
        handler: 'handlePermissionRevoked',
      },
      {
        event: 'CollateralModified(indexed uint128,indexed uint128,int256,indexed address)',
        handler: 'handleCollateralModified',
      },
      {
        event:
          'OrderCommitted(indexed uint128,indexed uint128,uint8,int128,uint256,uint256,uint256,uint256,uint256,indexed bytes32,address)',
        handler: 'handleOrderCommitted',
      },
    ],
  },
});

module.exports = {
  specVersion: '0.0.5',
  description: 'Kwenta Perps V3 API',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './perps-v3.graphql',
  },
  dataSources: manifest,
};
