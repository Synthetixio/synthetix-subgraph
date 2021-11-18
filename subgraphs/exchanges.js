const { clone } = require('lodash');

const { getContractDeployments } = require('./utils/network');
const { getCurrentNetwork } = require('./utils/network');

const latestRates = require('./fragments/latest-rates');
const balances = require('./fragments/balances');

const manifest = clone(latestRates.dataSources);
manifest.push(...balances.dataSources);

if (getCurrentNetwork() == 'mainnet') {
  manifest.push(
    {
      kind: 'ethereum/contract',
      name: 'exchanges_Synthetix4_viaOldProxy',
      network: getCurrentNetwork(),
      source: {
        address: '0xc011a72400e58ecd99ee497cf89e3775d4bd732f',
        abi: 'Synthetix4',
        startBlock: 6841188,
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.5',
        language: 'wasm/assemblyscript',
        file: '../src/exchanges.ts',
        entities: ['SynthExchange'],
        abis: [
          {
            name: 'Synthetix4',
            file: '../abis/Synthetix_bytes4.json',
          },
          {
            name: 'Synthetix32',
            file: '../abis/Synthetix_bytes32.json',
          },
          {
            name: 'Synthetix',
            file: '../abis/Synthetix.json',
          },
          {
            name: 'AddressResolver',
            file: '../abis/AddressResolver.json',
          },
          {
            name: 'ExchangeRates',
            file: '../abis/ExchangeRates.json',
          },
          {
            name: 'AggregatorProxy',
            file: '../abis/AggregatorProxy.json',
          },
        ],
        eventHandlers: [
          {
            event: 'SynthExchange(indexed address,bytes4,uint256,bytes4,uint256,address)',
            handler: 'handleSynthExchange',
          },
        ],
      },
    },
    {
      kind: 'ethereum/contract',
      name: 'exchanges_Synthetix_viaOldProxy',
      network: getCurrentNetwork(),
      source: {
        address: '0xc011a72400e58ecd99ee497cf89e3775d4bd732f',
        abi: 'Synthetix',
        startBlock: 8622911,
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.5',
        language: 'wasm/assemblyscript',
        file: '../src/exchanges.ts',
        entities: ['SynthExchange', 'ExchangeReclaim', 'ExchangeRebate'],
        abis: [
          {
            name: 'Synthetix4',
            file: '../abis/Synthetix_bytes4.json',
          },
          {
            name: 'Synthetix32',
            file: '../abis/Synthetix_bytes32.json',
          },
          {
            name: 'Synthetix',
            file: '../abis/Synthetix.json',
          },
          {
            name: 'AddressResolver',
            file: '../abis/AddressResolver.json',
          },
          {
            name: 'ExchangeRates',
            file: '../abis/ExchangeRates.json',
          },
        ],
        eventHandlers: [
          {
            event: 'SynthExchange(indexed address,bytes32,uint256,bytes32,uint256,address)',
            handler: 'handleSynthExchange',
          },
          {
            event: 'ExchangeReclaim(indexed address,bytes32,uint256)',
            handler: 'handleExchangeReclaim',
          },
          {
            event: 'ExchangeRebate(indexed address,bytes32,uint256)',
            handler: 'handleExchangeRebate',
          },
        ],
      },
    },
  );
}

getContractDeployments('ProxyERC20').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `exchanges_Synthetix_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'Synthetix',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/exchanges.ts',
      entities: ['SynthExchange', 'ExchangeReclaim', 'ExchangeRebate'],
      abis: [
        {
          name: 'Synthetix4',
          file: '../abis/Synthetix_bytes4.json',
        },
        {
          name: 'Synthetix32',
          file: '../abis/Synthetix_bytes32.json',
        },
        {
          name: 'Synthetix',
          file: '../abis/Synthetix.json',
        },
        {
          name: 'AddressResolver',
          file: '../abis/AddressResolver.json',
        },
        {
          name: 'ExchangeRates',
          file: '../abis/ExchangeRates.json',
        },
        {
          name: 'AggregatorProxy',
          file: '../abis/AggregatorProxy.json',
        },
      ],
      eventHandlers: [
        {
          event: 'SynthExchange(indexed address,bytes32,uint256,bytes32,uint256,address)',
          handler: 'handleSynthExchange',
        },
        {
          event: 'ExchangeReclaim(indexed address,bytes32,uint256)',
          handler: 'handleExchangeReclaim',
        },
        {
          event: 'ExchangeRebate(indexed address,bytes32,uint256)',
          handler: 'handleExchangeRebate',
        },
        {
          event: 'AtomicSynthExchange(indexed address,bytes32,uint256,bytes32,uint256,address)',
          handler: 'handleAtomicSynthExchange',
        },
      ],
    },
  });
});

getContractDeployments('SystemSettings').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `exchanges_SystemSettings_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'SystemSettings',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/exchanges.ts',
      entities: ['SystemSettings'],
      abis: [
        {
          name: 'SystemSettings',
          file: '../abis/SystemSettings.json',
        },
      ],
      eventHandlers: [
        {
          event: 'ExchangeFeeUpdated(bytes32,uint256)',
          handler: 'handleFeeChange',
        },
      ],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Exchanges API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './exchanges.graphql',
  },
  dataSources: manifest,
  templates: latestRates.templates,
};
