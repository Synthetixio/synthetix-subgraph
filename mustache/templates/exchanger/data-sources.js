const { createStartBlock } = require('../common');
/**
 * To modify the start blocks for test syncing you can simply change
 * UNIVERSAL_START_BLOCK from null to a number in the npm run codegen:exchanger:test
 * command or fill out each one individually by changing the null value for
 * testStartBlock for each contract in createStartBlock below.
 *
 * NOTE this only changes the exchanger specific contracts. The exchanger yaml also
 * includes rates contracts. you can modify those start blocks in './rate-differences.js'
 */
const StartBlocks = {
  Exchanger: createStartBlock({ prodStartBlock: 10557958, testStartBlock: null }),
  Exchanger_v2: createStartBlock({ prodStartBlock: 10772592, testStartBlock: null }),
  Exchanger_v3: createStartBlock({ prodStartBlock: 11012438, testStartBlock: null }),
  Synthetix: createStartBlock({ prodStartBlock: 10782000, testStartBlock: null }),
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
