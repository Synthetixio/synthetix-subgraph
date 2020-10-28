const { createStartBlock } = require('../common');
/**
 * DO NOT commit a change to any of the null values in this file.
 * You may change them for testing and syncing the Graph faster but
 * leave them as null in your commits
 */
const universalTestBlock = null;

/**
 * To modify the start blocks for test syncing you can simply use
 * the universal test block above or fill out each one individually
 * by changing the null value for test in createStartBlock
 * process.env.TEST_YAML is a safety check in createStartBlock in case
 * someone commits a non null value to prevent prod values from being overwritten
 */
const StartBlocks = {
  Exchanger: createStartBlock({ prod: 10557958, test: null, universalTestBlock }),
  Exchanger_v2: createStartBlock({ prod: 10772592, test: null, universalTestBlock }),
  Exchanger_v3: createStartBlock({ prod: 11012438, test: null, universalTestBlock }),
  Synthetix: createStartBlock({ prod: 10782000, test: null, universalTestBlock }),
};

module.exports = [
  {
    name: 'Exchanger',
    mappingFile: '../src/exchanger-mapping.ts',
    startBlock: StartBlocks.Exchanger,
    address: "'0x439502C922ADA61FE49329248B7A8ecb31C0b329'",
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
        event: 'ExchangeEntrySettled(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256,uint256)',
        handler: 'handleExchangeEntrySettled',
      },
      {
        event: 'ExchangeEntryAppended(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256)',
        handler: 'handleExchangeEntryAppended',
      },
    ],
  },
  {
    name: 'Exchanger_v2',
    mappingFile: '../src/exchanger-mapping.ts',
    startBlock: StartBlocks.Exchanger_v2,
    address: "'0x1d53a13D78766C0Db6eF73eC0ae1138eA2b6f5D4'",
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
        event: 'ExchangeEntrySettled(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256,uint256)',
        handler: 'handleExchangeEntrySettled',
      },
      {
        event: 'ExchangeEntryAppended(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256)',
        handler: 'handleExchangeEntryAppended',
      },
    ],
  },
  {
    name: 'Exchanger_v3',
    mappingFile: '../src/exchanger-mapping.ts',
    startBlock: StartBlocks.Exchanger_v3,
    address: "'0xc4942df0d3c561c71417BBA09d2DEA7a3CC676Fb'",
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
        event: 'ExchangeEntrySettled(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256,uint256)',
        handler: 'handleExchangeEntrySettled',
      },
      {
        event: 'ExchangeEntryAppended(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256)',
        handler: 'handleExchangeEntryAppended',
      },
    ],
  },
  {
    name: 'Synthetix',
    mappingFile: '../src/exchanger-mapping.ts',
    startBlock: StartBlocks.Synthetix,
    address: "'0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F'",
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
  },
];
