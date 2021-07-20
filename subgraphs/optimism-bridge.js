const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

getContractDeployments('SynthetixBridgeToOptimism').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `optimismBridge_SynthetixBridgeToOptimism_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'OptimismBridge',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/optimism-bridge.ts',
      entities: ['DepositInitiated'],
      abis: [
        {
          name: 'OptimismBridge',
          file: '../abis/OptimismBridge.json',
        },
      ],
      eventHandlers: [
        {
          event: 'DepositInitiated(indexed address,address,uint256)',
          handler: 'handleDepositInitiated',
        },
      ],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Optimism Bridge API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './optimism-bridge.graphql',
  },
  dataSources: manifest,
};
