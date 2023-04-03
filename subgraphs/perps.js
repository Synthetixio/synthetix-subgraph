const { getCurrentNetwork, getContractDeployments } = require('./utils/network');

const manifest = [];

// get config
const currentNetwork = getCurrentNetwork();

const mainnetConfig = {
  managerStartBlock: 52456507,
  smartMarginFactoryAddress: '0xD56b9537ee5E0779F0522475525053eE614b07Ba',
  smartMarginFactoryStartBlock: 84860950,
  smartMarginEventsAddress: '0x79bB35A27bfC441b21078debeE52DE3215106A5B',
  smartMarginEventsStartBlock: 84860972,
};

const testnetConfig = {
  managerStartBlock: 3495320,
  smartMarginFactoryAddress: '0x500A139459fA3628C416A6b19BFADd83B20e5D0b',
  smartMarginFactoryStartBlock: 7378387,
  smartMarginEventsAddress: '0xa0bb2Ebdf6FA0F1d6363D96a8e981EC6323157B7',
  smartMarginEventsStartBlock: 7378391,
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

// smart margin events
manifest.push({
  kind: 'ethereum/contract',
  name: 'smartmargin_events',
  network: getCurrentNetwork(),
  source: {
    address: config.smartMarginEventsAddress,
    startBlock: config.smartMarginEventsStartBlock,
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
        event: 'ConditionalOrderPlaced(indexed address,uint256,bytes32,int256,int256,uint256,uint8,uint128,bool)',
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
