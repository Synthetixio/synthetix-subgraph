const { getContractDeployments, getCurrentNetwork } = require('../utils/network');

const exchangeRatesContractAddresses = getContractDeployments('ExchangeRates');

const exchangeRatesManifests = [];

exchangeRatesContractAddresses.forEach((ca, i) => {
  let startBlock = ca.startBlock;

  exchangeRatesManifests.push({
    kind: 'ethereum/contract',
    name: `ExchangeRates_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: ca.address,
      startBlock: Math.max(parseInt(process.env.SNX_START_BLOCK || '0'), startBlock),
      abi: 'ExchangeRates',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.6',
      language: 'wasm/assemblyscript',
      file: '../src/fragments/latest-rates.ts',
      entities: ['LatestRate'],
      abis: [
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
          event: 'AggregatorAdded(bytes32,address)',
          handler: 'handleAggregatorAdded',
        },
        {
          event: 'RatesUpdated(bytes32[],uint256[])',
          handler: 'handleRatesUpdated',
        },
      ],
    },
  });
});

const proxyTemplates = [];
for (const proxyTemplateName of ['AggregatorProxy', 'SynthAggregatorProxy']) {
  proxyTemplates.push({
    kind: 'ethereum/contract',
    name: proxyTemplateName,
    network: getCurrentNetwork(),
    source: {
      abi: 'AggregatorProxy',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.6',
      language: 'wasm/assemblyscript',
      file: '../src/fragments/latest-rates.ts',
      entities: [],
      abis: [
        {
          name: 'AggregatorProxy',
          file: '../abis/AggregatorProxy.json',
        },
      ],
      eventHandlers: [
        {
          event: 'AggregatorConfirmed(indexed address,indexed address)',
          handler: 'handleAggregatorProxyAddressUpdated',
        },
      ],
    },
  });
}

const aggregatorTemplate = {
  kind: 'ethereum/contract',
  name: 'Aggregator',
  network: getCurrentNetwork(),
  source: {
    abi: 'Aggregator',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/fragments/latest-rates.ts',
    entities: ['LatestRates'],
    abis: [
      {
        name: 'Aggregator',
        file: '../abis/Aggregator.json',
      },
      {
        name: 'ExchangeRates',
        file: '../abis/ExchangeRates.json',
      },
      {
        name: 'AddressResolver',
        file: '../abis/AddressResolver.json',
      },
    ],
    eventHandlers: [
      {
        event: 'AnswerUpdated(indexed int256,indexed uint256,uint256)',
        handler: 'handleAggregatorAnswerUpdated',
      },
    ],
  },
};

const synthAggregatorTemplate = {
  kind: 'ethereum/contract',
  name: 'SynthAggregator',
  network: getCurrentNetwork(),
  source: {
    abi: 'Aggregator',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.6',
    language: 'wasm/assemblyscript',
    file: '../src/fragments/latest-rates.ts',
    entities: ['LatestRates'],
    abis: [
      {
        name: 'Aggregator',
        file: '../abis/Aggregator.json',
      },
      {
        name: 'ExchangeRates',
        file: '../abis/ExchangeRates.json',
      },
      {
        name: 'AddressResolver',
        file: '../abis/AddressResolver.json',
      },
    ],
    eventHandlers: [
      {
        event: 'AnswerUpdated(indexed int256,indexed uint256,uint256)',
        handler: 'handleAggregatorAnswerUpdated',
      },
    ],
  },
};

module.exports = {
  dataSources: exchangeRatesManifests,
  templates: [...proxyTemplates, aggregatorTemplate, synthAggregatorTemplate],
};
