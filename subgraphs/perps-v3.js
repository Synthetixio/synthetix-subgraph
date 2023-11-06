const { getCurrentNetwork } = require('./utils/network');

const manifest = [];

// get config
const currentNetwork = getCurrentNetwork();

manifest.push({
  kind: 'ethereum/contract',
  name: 'PerpsV3',
  network: currentNetwork,
  source: {
    address: '0x9863Dae3f4b5F4Ffe3A841a21565d57F2BA10E87',
    abi: 'PerpsV3MarketProxy',
    startBlock: 9243743,
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/perps-v3.ts',
    entities: ['Account', 'OrderSettled'],
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
    ],
  },
});

module.exports = {
  specVersion: '0.0.4',
  description: 'Kwenta Perps V3 API',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './perps-v3.graphql',
  },
  dataSources: manifest,
};
