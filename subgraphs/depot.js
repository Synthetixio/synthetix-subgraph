const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

getContractDeployments('Depot').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `Depot_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'Depot',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/depot.ts',
      entities: ['UserAction', 'ClearedDeposit', 'Exchange'],
      abis: [
        {
          name: 'Depot',
          file: '../abis/Depot.json',
        },
      ],
      eventHandlers: [
        {
          event: 'ClearedDeposit(indexed address,indexed address,uint256,uint256,indexed uint256)',
          handler: 'handleClearedDeposit',
        },
        {
          event: 'SynthWithdrawal(address,uint256)',
          handler: 'handleSynthWithdrawal',
        },
        {
          event: 'SynthDeposit(indexed address,uint256,indexed uint256)',
          handler: 'handleSynthDeposit',
        },
        {
          event: 'SynthDepositRemoved(indexed address,uint256,indexed uint256)',
          handler: 'handleSynthDepositRemoved',
        },
        {
          event: 'SynthDepositNotAccepted(address,uint256,uint256)',
          handler: 'handleSynthDepositNotAccepted',
        },
        {
          event: 'Exchange(string,uint256,string,uint256)',
          handler: 'handleExchange',
        },
      ],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Depot API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './depot.graphql',
  },
  dataSources: manifest,
};
