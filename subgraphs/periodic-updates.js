const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

getContractDeployments('ProxyERC20').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `periodicUpdates_ProxyERC20_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: getCurrentNetwork() === 'mainnet' ? Math.max(13000000, a.startBlock) : a.startBlock,
      abi: 'Proxy',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/periodic-updates.ts',
      entities: ['DebtState', 'SystemSetting'],
      abis: [
        {
          name: 'Proxy',
          file: '../abis/Proxy.json',
        },
        {
          name: 'AddressResolver',
          file: '../abis/AddressResolver.json',
        },
        {
          name: 'SynthetixDebtShare',
          file: '../abis/SynthetixDebtShare.json',
        },
        {
          name: 'Synthetix',
          file: '../abis/SynthetixGlobalDebt.json',
        },
        {
          name: 'SystemSettings',
          file: '../abis/SystemSettings.json',
        },
      ],
      blockHandlers: [{ handler: 'handleBlock' }],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Periodic Updates API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './periodic-updates.graphql',
  },
  dataSources: manifest,
};
