const { getCurrentNetwork, getContractDeployments } = require('./utils/network');

const manifest = [];

// get config
const currentNetwork = getCurrentNetwork();

const mainnetConfig = {
  managerStartBlock: 52456507,
  factories: [
    {
      address: '0xf1BC9852e89e0b6ABa81548A10c0afF9ACa95CaA',
      startBlock: 89109827,
    },
    {
      address: '0x8234F990b149Ae59416dc260305E565e5DAfEb54',
      startBlock: 92005505,
    },
  ],
  events: [
    {
      address: '0x64Db098EDbB149DBe99900c96CC73b6F9A1Af2db',
      startBlock: 89109878,
    },
    {
      address: '0x6ba8eb350c72a665b841da90f03401539e7d765f',
      startBlock: 92005518,
    },
  ],
};

const testnetConfig = {
  managerStartBlock: 3495320,
  factories: [
    {
      address: '0xb5dCFb08a2CB07399b75B650B980732340c5Ed90',
      startBlock: 7900382,
    },
  ],
  events: [
    {
      address: '0x3617154844291712cBD2148D912b61d6641229a4',
      startBlock: 7900386,
    },
  ],
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
        event: 'PositionModified(indexed uint256,indexed address,uint256,int256,int256,uint256,uint256,uint256,int256)',
        handler: 'handlePositionModifiedV2',
      },
      {
        event: 'PositionLiquidated(uint256,address,address,int256,uint256,uint256)',
        handler: 'handlePositionLiquidated',
      },
      {
        event: 'PositionLiquidated(uint256,address,address,int256,uint256,uint256,uint256,uint256)',
        handler: 'handlePositionLiquidatedV2',
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

// smart margin factory
config.factories.forEach((factory, ind) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `smartmargin_factory_${ind}`,
    network: getCurrentNetwork(),
    source: {
      address: factory.address,
      startBlock: factory.startBlock,
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
});

// smart margin events
config.events.forEach((events, ind) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `smartmargin_events_${ind}`,
    network: getCurrentNetwork(),
    source: {
      address: events.address,
      startBlock: events.startBlock,
      abi: 'Events',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.6',
      language: 'wasm/assemblyscript',
      file: '../src/smartmargin.ts',
      entities: ['Events'],
      abis: [
        {
          name: 'Events',
          file: '../abis/Events.json',
        },
      ],
      eventHandlers: [
        {
          event: 'Deposit(indexed address,indexed address,uint256)',
          handler: 'handleDeposit',
        },
        {
          event: 'Withdraw(indexed address,indexed address,uint256)',
          handler: 'handleWithdraw',
        },
        {
          event: 'ConditionalOrderPlaced(indexed address,uint256,bytes32,int256,int256,uint256,uint8,uint256,bool)',
          handler: 'handleOrderPlaced',
        },
        {
          event: 'ConditionalOrderCancelled(indexed address,uint256,uint8)',
          handler: 'handleOrderCancelled',
        },
        {
          event: 'ConditionalOrderFilled(indexed address,uint256,uint256,uint256)',
          handler: 'handleOrderFilled',
        },
      ],
    },
  });
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
