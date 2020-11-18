const StartBlocks = require('./set-start-blocks.json');
const { createStartBlock } = require('../common');

module.exports = {
  createYaml: (env, universalTestBlock) =>
    Object.entries(StartBlocks).map(([name, { prod, test, address }]) => ({
      startBlock: createStartBlock({ prod, test }, env, universalTestBlock),
      name,
      mappingFile: '../src/synth-transfers-mapping.ts',
      address,
      abi: 'Synth',
      entities: ['SynthTransfer', 'SynthHolder', 'SynthBalance'],
      abis: [
        {
          name: 'Synth',
          path: '../abis/Synth.json',
        },
      ],
      events: [
        {
          event: 'Transfer(indexed address,indexed address,uint256)',
          handler: 'handleTransferSynth',
        },
      ],
    })),
};
