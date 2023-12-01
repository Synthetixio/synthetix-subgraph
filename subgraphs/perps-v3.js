const { getCurrentNetwork } = require('./utils/network');

const manifest = [];

// get config
const currentNetwork = getCurrentNetwork();

manifest.push({
  kind: 'ethereum/contract',
  name: 'PerpsV3',
  network: currentNetwork,
  source: {
    address: '0x75c43165ea38cB857C45216a37C5405A7656673c',
    abi: 'PerpsV3MarketProxy',
    startBlock: 13044488,
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
          'SettlementStrategyAdded(indexed uint128,(uint8,uint256,uint256,address,bytes32,uint256,bool),indexed uint256)',
        handler: 'handleSettlementStrategyAdded',
      },
      {
        event:
          'SettlementStrategySet(indexed uint128,indexed uint256,(uint8,uint256,uint256,address,bytes32,uint256,bool))',
        handler: 'handleSettlementStrategyEnabled',
      },
      {
        event: 'MarketUpdated(uint128,uint256,int256,uint256,int256,int256,int256)',
        handler: 'handleFundingRecomputed',
      },
      {
        event: 'PermissionGranted(indexed uint128,indexed bytes32,indexed address,address)',
        handler: 'handlePermissionGranted',
      },
      {
        event: 'PermissionRevoked(indexed uint128,indexed bytes32,indexed address,address)',
        handler: 'handlePermissionRevoked',
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
