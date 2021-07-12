const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

getContractDeployments('ProxyERC20').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `ProxyERC20_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'Proxy',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/global-debt.ts',
      entities: ['DebtState'],
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
          name: 'SynthetixState',
          file: '../abis/SynthetixState.json',
        },
        {
          name: 'Synthetix',
          file: '../abis/Synthetix.json',
        },
      ],
      blockHandlers: [{ handler: 'handleBlock' }],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Global Debt API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './global-debt.graphql',
  },
  dataSources: manifest,
};
