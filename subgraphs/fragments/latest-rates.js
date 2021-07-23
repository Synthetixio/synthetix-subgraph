const { getContractDeployments, versions, getCurrentNetwork, getCurrentSubgraph } = require('../utils/network');

const exchangeRatesContractAddresses = getContractDeployments('ExchangeRates');

const exchangeRatesManifests = [];

// the rates updated event changed from bytes4 to bytes32 in the sirius release
const BYTE32_UPDATE = versions.Sirius;

// the earliest start block to track exchanger subgraph rates
const EXCHANGER_START_BLOCK = 10537958;
// the earliest start block to track exchanges subgraph rates
const EXCHANGES_START_BLOCK = 6841188;
// the earliest start block to track shorts subgraph rates
const SHORTS_START_BLOCK = 11513382;

exchangeRatesContractAddresses.forEach((ca, i) => {
  let startBlock = ca.startBlock;
  if (getCurrentSubgraph() === 'exchanger' && startBlock < EXCHANGER_START_BLOCK) {
    startBlock = EXCHANGER_START_BLOCK;
  } else if (getCurrentSubgraph() === 'exchanges' && startBlock < EXCHANGES_START_BLOCK) {
    startBlock = EXCHANGES_START_BLOCK;
  } else if (getCurrentSubgraph() === 'shorts' && startBlock < SHORTS_START_BLOCK) {
    startBlock = SHORTS_START_BLOCK;
  }

  exchangeRatesManifests.push({
    kind: 'ethereum/contract',
    name: `ExchangeRates_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: ca.address,
      startBlock,
      abi: 'ExchangeRates',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/fragments/latest-rates.ts',
      entities: ['LatestRate', 'InversePricingInfo'],
      abis: [
        {
          name: 'ExchangeRates',
          file:
            ca.startBlock >= BYTE32_UPDATE
              ? '../abis/ExchangeRates.json'
              : getCurrentNetwork() === 'mainnet'
              ? '../abis/ExchangeRates_bytes4.json'
              : '../abis/ExchangeRates.json',
        },
        {
          name: 'AggregatorProxy',
          file: '../abis/AggregatorProxy.json',
        },
      ],
      eventHandlers:
        getCurrentNetwork() !== 'mainnet' || ca.startBlock >= BYTE32_UPDATE
          ? [
              {
                event: 'AggregatorAdded(bytes32,address)',
                handler: 'handleAggregatorAdded',
              },
              {
                event: 'RatesUpdated(bytes32[],uint256[])',
                handler: 'handleRatesUpdated',
              },
              {
                event: 'InversePriceConfigured(bytes32,uint256,uint256,uint256)',
                handler: 'handleInverseConfigured',
              },
              {
                event: 'InversePriceFrozen(bytes32,uint256,uint256,address)',
                handler: 'handleInverseFrozen',
              },
            ]
          : [
              {
                event: 'RatesUpdated(bytes4[],uint256[])',
                handler: 'handleRatesUpdated',
              },
            ],
    },
  });
});

if (getCurrentNetwork() === 'mainnet' || getCurrentNetwork() == 'kovan') {
  // hack for chainlink, tracking of aggregator address changes
  exchangeRatesManifests.push({
    kind: 'ethereum/contract',
    name: 'ChainlinkMultisig',
    network: getCurrentNetwork(),
    source: {
      address: '0x21f73d42eb58ba49ddb685dc29d3bf5c0f0373ca',
      startBlock: 10500000,
      abi: 'GnosisSafe',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/fragments/latest-rates.ts',
      entities: [],
      abis: [
        {
          name: 'GnosisSafe',
          file: '../abis/GnosisSafe.json',
        },
        {
          name: 'ProxyERC20',
          file: '../abis/ProxyERC20.json',
        },
        {
          name: 'Synthetix',
          file: '../abis/Synthetix.json',
        },
        {
          name: 'ExchangeRates',
          file: '../abis/ExchangeRates.json',
        },
        {
          name: 'AddressResolver',
          file: '../abis/AddressResolver.json',
        },
        {
          name: 'AggregatorProxy',
          file: '../abis/AggregatorProxy.json',
        },
      ],
      eventHandlers: [
        {
          event: 'ExecutionSuccess(bytes32,uint256)',
          handler: 'handleChainlinkUpdate',
        },
      ],
    },
  });
}

const proxyTemplates = [];
for (const proxyTemplateName of ['AggregatorProxy', 'SynthAggregatorProxy', 'InverseAggregatorProxy']) {
  proxyTemplates.push({
    kind: 'ethereum/contract',
    name: proxyTemplateName,
    network: getCurrentNetwork(),
    source: {
      abi: 'AggregatorProxy',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
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
    apiVersion: '0.0.4',
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
    apiVersion: '0.0.4',
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

// separate aggregator for inverse synths
const inverseAggregatorTemplate = {
  kind: 'ethereum/contract',
  name: 'InverseAggregator',
  network: getCurrentNetwork(),
  source: {
    abi: 'Aggregator',
  },
  mapping: {
    kind: 'ethereum/events',
    apiVersion: '0.0.4',
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
        handler: 'handleInverseAggregatorAnswerUpdated',
      },
    ],
  },
};

module.exports = {
  dataSources: exchangeRatesManifests,
  templates: [...proxyTemplates, aggregatorTemplate, synthAggregatorTemplate, inverseAggregatorTemplate],
};
