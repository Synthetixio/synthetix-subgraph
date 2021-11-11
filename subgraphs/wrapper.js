const { clone } = require('lodash');
const { getContractDeployments, getCurrentNetwork } = require('./utils/network');
const latestRates = require('./fragments/latest-rates');
let manifest = clone(latestRates.dataSources);

getContractDeployments('WrapperFactory').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `wrapperFactory_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'WrapperFactory',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/wrapper.ts',
      entities: [],
      abis: [
        {
          name: 'WrapperFactory',
          file: '../abis/WrapperFactory.json',
        },
      ],
      eventHandlers: [
        {
          event: 'WrapperCreated(indexed address,indexed bytes32,address)',
          handler: 'handleWrapperCreated',
        },
      ],
    },
  });
});

const wrapperTemplate = {
  kind: 'ethereum/contract',
  name: 'WrapperTemplate',
  network: getCurrentNetwork(),
  source: {
    abi: 'Wrapper',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.5',
    language: 'wasm/assemblyscript',
    file: '../src/wrapper.ts',
    entities: ['Wrapper', 'Mint', 'Burn'],
    abis: [
      {
        name: 'Wrapper',
        file: '../abis/Wrapper.json',
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
        event: 'Minted(indexed address,uint256,uint256,uint256)',
        handler: 'handleMinted',
      },
      {
        event: 'Burned(indexed address,uint256,uint256,uint256)',
        handler: 'handleBurned',
      },
    ],
  },
};

getContractDeployments('EtherWrapper').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `etherWrapper_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'EtherWrapper',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/wrapper.ts',
      entities: ['Wrapper'],
      abis: [
        {
          name: 'EtherWrapper',
          file: '../abis/EtherWrapper.json',
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
          event: 'Minted(indexed address,uint256,uint256,uint256)',
          handler: 'handleMinted',
        },
        {
          event: 'Burned(indexed address,uint256,uint256,uint256)',
          handler: 'handleBurned',
        },
      ],
    },
  });
});

getContractDeployments('SystemSettings').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `systemSettings_${i}`,
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
      file: '../src/wrapper.ts',
      entities: [],
      abis: [
        {
          name: 'SystemSettings',
          file: '../abis/SystemSettings.json',
        },
        {
          name: 'AddressResolver',
          file: '../abis/AddressResolver.json',
        },
      ],
      eventHandlers: [
        {
          event: 'WrapperMaxTokenAmountUpdated(address,uint256)',
          handler: 'handleWrapperMaxTokenAmountUpdated',
        },
        {
          event: 'EtherWrapperMaxETHUpdated(uint256)',
          handler: 'handleEtherWrapperMaxETHUpdated',
        },
      ],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Wrapper API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './wrapper.graphql',
  },
  dataSources: manifest,
  templates: latestRates.templates.concat([wrapperTemplate]),
};
