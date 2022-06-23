const { clone } = require('lodash');

const { getContractDeployments, getCurrentNetwork, createSubgraphManifest } = require('./utils/network');

const latestRatesManifests = require('./fragments/latest-rates');

const manifest = clone(latestRatesManifests.dataSources);

// add exchanger events
getContractDeployments('Exchanger').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `exchanger_Exchanger_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'Exchanger',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/exchanger.ts',
      entities: ['ExchangeEntrySettled', 'ExchangeEntryAppended', 'TemporaryExchangePartnerTracker'],
      abis: [
        {
          name: 'Exchanger',
          file: '../abis/Exchanger.json',
        },
      ],
      eventHandlers: [
        {
          event:
            'ExchangeEntrySettled(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256,uint256)',
          handler: 'handleExchangeEntrySettled',
        },
        {
          event: 'ExchangeEntryAppended(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256)',
          handler: 'handleExchangeEntryAppended',
        },
      ],
    },
  });
});

// add synthetix (only the new contracts)
getContractDeployments('ProxyERC20').forEach((a, i) => {
  if (i === 0 && (getCurrentNetwork() !== 'optimism' || getCurrentNetwork() !== 'optimism-kovan')) {
    manifest.push({
      kind: 'ethereum/contract',
      name: 'exchanger_SynthetixOldTracking',
      network: getCurrentNetwork(),
      source: {
        address: a.address,
        startBlock: a.startBlock,
        abi: 'SynthetixOldTracking',
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.5',
        language: 'wasm/assemblyscript',
        file: '../src/exchanger.ts',
        entities: ['DailyExchangePartner', 'ExchangePartner', 'TemporaryExchangePartnerTracker'],
        abis: [
          {
            name: 'SynthetixOldTracking',
            file: '../abis/Synthetix_oldTracking.json',
          },
        ],
        eventHandlers: [
          {
            event: 'ExchangeTracking(indexed bytes32,bytes32,uint256)',
            handler: 'handleExchangeTrackingV1',
          },
        ],
      },
    });
  }
  manifest.push({
    kind: 'ethereum/contract',
    name: `exchanger_Synthetix_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock:
        i === 0 && getCurrentNetwork() === 'mainnet'
          ? Math.max(parseInt(process.env.SNX_START_BLOCK || '0'), 12733161)
          : a.startBlock,
      abi: 'Synthetix',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/exchanger.ts',
      entities: ['DailyExchangePartner', 'ExchangePartner', 'TemporaryExchangePartnerTracker'],
      abis: [
        {
          name: 'Synthetix',
          file: '../abis/Synthetix.json',
        },
      ],
      eventHandlers: [
        {
          event: 'ExchangeTracking(indexed bytes32,bytes32,uint256,uint256)',
          handler: 'handleExchangeTrackingV2',
        },
      ],
    },
  });
});

module.exports = createSubgraphManifest('exchanger', manifest, latestRatesManifests.templates);
