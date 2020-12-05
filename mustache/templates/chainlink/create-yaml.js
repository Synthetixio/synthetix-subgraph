const Contracts = require('../rates/contracts');
const { createStartBlock } = require('../common');

// TODO - did we have any Synthetix aggregators that were not provided by
// Chainlink. If so, we need to add their names here to filter them out.
const SYNTHETIX_AGGREGATOR_NAMES = [];

module.exports = {
  createYaml: (env, universalTestBlock) => {
    const createAggregatorBlock = ({ name, startBlocks, address }) => ({
      name,
      mappingFile: '../src/chainlink-mapping.ts',
      startBlock: createStartBlock(startBlocks, env, universalTestBlock, false),
      address,
      abi: 'Aggregator',
      entities: ['AggregatorAnswer'],
      abis: [
        {
          name: 'Aggregator',
          path: '../abis/Aggregator.json',
        },
        {
          name: 'ExchangeRates',
          path: '../abis/ExchangeRates.json',
        },
        {
          name: 'AddressResolver',
          path: '../abis/AddressResolver.json',
        },
      ],
      events: [
        {
          event: 'AnswerUpdated(indexed int256,indexed uint256,uint256)',
          handler: 'handleAggregatorAnswerUpdated',
        },
      ],
    });
    return Contracts.filter(({ type }) => type === 'aggregator').map(({ name, prod, test, address }) => {
      if (!SYNTHETIX_AGGREGATOR_NAMES.includes(name)) {
        const startBlocks = { prod, test };
        return createAggregatorBlock({ name, startBlocks, address });
      }
    });
  },
};
