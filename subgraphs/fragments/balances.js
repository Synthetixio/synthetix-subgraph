const { getContractDeployments, getCurrentNetwork, getReleaseInfo } = require('../utils/network');

const synthsManifests = [];

// TODO: added for possible future case of needing to handle these events with templated data source
/*getContractDeployments('Issuer').forEach((a, i) => {
  synthsManifests.push({
    kind: 'ethereum/contract',
    name: `balances_Issuer_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'Issuer',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/fragments/balances.ts',
      entities: ['Synth'],
      abis: [
        {
          name: 'Issuer',
          file: '../abis/Issuer.json',
        },
        {
          name: 'Synth',
          file: '../abis/Synth.json',
        },
      ],
      eventHandlers: [
        {
          event: 'SynthAdded(bytes32,address)',
          handler: 'handleAddSynth',
        },
        {
          event: 'SynthRemoved(bytes32,address)',
          handler: 'handleRemoveSynth',
        },
      ],
    },
  });
});*/

const synths = getReleaseInfo('synths');

for (const { name } of synths) {
  getContractDeployments('Proxy' + (name == 'sUSD' ? 'ERC20' + name : name)).forEach((a, i) => {
    synthsManifests.push({
      kind: 'ethereum/contract',
      // for some reason sUSD has different contract name
      name: `balances_Synth${name}_${i}`,
      network: getCurrentNetwork(),
      source: {
        address: a.address,
        startBlock: a.startBlock,
        abi: 'Synth',
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.6',
        language: 'wasm/assemblyscript',
        file: '../src/fragments/balances.ts',
        entities: ['Synth', 'LatestSynthBalance', 'AggregateSynthBalance'],
        abis: [
          {
            name: 'Synth',
            file: '../abis/Synth.json',
          },
        ],
        eventHandlers: [
          {
            event: 'Transfer(indexed address,indexed address,uint256)',
            handler: 'handleTransferSynth',
          },
        ],
      },
    });
  });
}

module.exports = {
  dataSources: synthsManifests,
};
