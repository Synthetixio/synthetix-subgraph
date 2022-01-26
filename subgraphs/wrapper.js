const { clone } = require('lodash');
const { getContractDeployments, getCurrentNetwork } = require('./utils/network');
const latestRates = require('./fragments/latest-rates');
let manifest = clone(latestRates.dataSources);

getContractDeployments('WrapperFactory').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `WrapperFactory_${i}`,
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

let wrapperTemplate = {
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
    entities: ['Wrapper', 'WrapperMint', 'WrapperBurn'],
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
    name: `EtherWrapper_${i}`,
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
    name: `SystemSettings_${i}`,
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

// We manually add the ETH, DAI, and LUSD Wrappers when indexing Optimism
// because the WrapperFactory events that would generate them
// were lost in the regenesis on 11/11/21.
if (getCurrentNetwork() == 'optimism') {
  let daiWrapper = clone(wrapperTemplate);
  daiWrapper.name = 'daiWrapper';
  let daiSource = clone(daiWrapper.source);
  daiSource.address = '0xad32aA4Bff8b61B4aE07E3BA437CF81100AF0cD7';
  daiWrapper.source = daiSource;
  daiWrapper.source.startBlock = parseInt(process.env.SNX_START_BLOCK) || 0;
  manifest.push(daiWrapper);

  let ethWrapper = clone(wrapperTemplate);
  ethWrapper.name = 'ethWrapper';
  let ethSource = clone(ethWrapper.source);
  ethSource.address = '0x6202A3B0bE1D222971E93AaB084c6E584C29DB70';
  ethWrapper.source = ethSource;
  ethWrapper.source.startBlock = parseInt(process.env.SNX_START_BLOCK) || 0;
  manifest.push(ethWrapper);

  let lusdWrapper = clone(wrapperTemplate);
  lusdWrapper.name = 'lusdWrapper';
  let lusdSource = clone(lusdWrapper.source);
  lusdSource.address = '0x8a91e92fdd86e734781c38db52a390e1b99fba7c';
  lusdWrapper.source = lusdSource;
  lusdWrapper.source.startBlock = parseInt(process.env.SNX_START_BLOCK) || 0;
  manifest.push(lusdWrapper);
}

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
