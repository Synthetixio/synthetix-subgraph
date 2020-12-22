const Contracts = require('./contracts');
const { createStartBlock } = require('../common');

module.exports = {
  createYaml: (env, universalTestBlock) => {
    const createExchangerBlock = ({ startBlocks, name, address }) => ({
      name,
      mappingFile: '../src/exchanger-mapping.ts',
      startBlock: createStartBlock(startBlocks, env, universalTestBlock),
      address,
      abi: 'Exchanger',
      entities: ['ExchangeEntrySettled', 'ExchangeEntryAppended', 'TemporaryExchangePartnerTracker'],
      abis: [
        {
          name: 'Exchanger',
          path: '../abis/Exchanger.json',
        },
      ],
      events: [
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
    });

    const createSynthetixBlock = ({ startBlocks, name, address }) => ({
      name,
      mappingFile: '../src/exchanger-mapping.ts',
      startBlock: createStartBlock(startBlocks, env, universalTestBlock),
      address,
      abi: 'Synthetix',
      entities: ['DailyExchangePartner', 'ExchangePartner', 'TemporaryExchangePartnerTracker'],
      abis: [
        {
          name: 'Synthetix',
          path: '../abis/Synthetix.json',
        },
      ],
      events: [
        {
          event: 'ExchangeTracking(indexed bytes32,bytes32,uint256)',
          handler: 'handleExchangeTracking',
        },
      ],
    });
    return Contracts.map(({ prod, test, type, name, address }) => {
      const startBlocks = { prod, test, exchanger: null };
      if (type === 'exchanger') {
        return createExchangerBlock({ startBlocks, name, address });
      } else if (type === 'synthetix') {
        return createSynthetixBlock({ startBlocks, name, address });
      } else {
        throw new Error('invalid type in exchanger');
      }
    });
  },
};
