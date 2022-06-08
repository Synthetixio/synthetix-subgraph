const { getContractDeployments, getCurrentNetwork, createSubgraphManifest } = require('./utils/network');

const manifest = [];

getContractDeployments('DelegateApprovals').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `delegation_DelegateApprovals_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'DelegateApprovals',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/delegation.ts',
      entities: ['DelegatedWallet'],
      abis: [
        {
          name: 'DelegateApprovals',
          file: '../abis/DelegateApprovals.json',
        },
      ],
      eventHandlers: [
        {
          event: 'Approval(indexed address,address,bytes32)',
          handler: 'handleDelegateApproval',
        },
        {
          event: 'WithdrawApproval(indexed address,address,bytes32)',
          handler: 'handleDelegateWithdrawApproval',
        },
      ],
    },
  });
});

module.exports = createSubgraphManifest('delegation', manifest, []);
