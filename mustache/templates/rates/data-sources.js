const { createStartBlock } = require('../common');
/**
 * To modify the start blocks for test syncing you can simply change
 * UNIVERSAL_START_BLOCK from null to a number in the npm run codegen:exchanger:test
 * command or fill out each one individually by changing the null value for
 * testStartBlock for each contract in createStartBlock below.
 *
 * NOTE this file controls the startBlocks for rate specific contracts in the rates subgraph
 * if you are looking to change the rates start blocks for the exchanger subgraph, please
 * reference `mustache/templates/exchanger/rates-differences.js`
 */
const StartBlocks = {
  ExchangeRates_v231: createStartBlock({ prodStartBlock: 7626469, testStartBlock: null }),
  ExchangeRates_v240: createStartBlock({ prodStartBlock: 8075694, testStartBlock: null }),
  ExchangeRates_v272: createStartBlock({ prodStartBlock: 8120141, testStartBlock: null }),
  ExchangeRates_v210: createStartBlock({ prodStartBlock: 8622895, testStartBlock: null }),
  ExchangeRates_v213: createStartBlock({ prodStartBlock: 8971442, testStartBlock: null }),
  ExchangeRates_v217: createStartBlock({ prodStartBlock: 9123410, testStartBlock: null }),
  ExchangeRates_v219: createStartBlock({ prodStartBlock: 9518289, testStartBlock: null }),
  ExchangeRates_v223: createStartBlock({ prodStartBlock: 10364342, testStartBlock: null }),
  ExchangeRates: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorAUD: createStartBlock({ prodStartBlock: 9085450, testStartBlock: null }),
  AggregatorEUR: createStartBlock({ prodStartBlock: 9085417, testStartBlock: null }),
  AggregatorCHF: createStartBlock({ prodStartBlock: 9085502, testStartBlock: null }),
  AggregatorGBP: createStartBlock({ prodStartBlock: 9085494, testStartBlock: null }),
  AggregatorJPY: createStartBlock({ prodStartBlock: 9085433, testStartBlock: null }),
  AggregatorXAG: createStartBlock({ prodStartBlock: 9085563, testStartBlock: null }),
  AggregatorXAU: createStartBlock({ prodStartBlock: 9085543, testStartBlock: null }),
  AggregatorFTSE: createStartBlock({ prodStartBlock: 9755177, testStartBlock: null }),
  AggregatorN225: createStartBlock({ prodStartBlock: 9755246, testStartBlock: null }),
  AggregatorSNX: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorETH: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorCOMP: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorKNC: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorLEND: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorREN: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorBTC: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorBNB: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorTRX: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorXTZ: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorXRP: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorLTC: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorLINK: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorEOS: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorBCH: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorETC: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorDASH: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorXMR: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorADA: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorCEX: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorDEFI: createStartBlock({ prodStartBlock: 10773070, testStartBlock: null }),
  AggregatorXAU_3: createStartBlock({ prodStartBlock: 10873070, testStartBlock: null }),
  AggregatorXAG_3: createStartBlock({ prodStartBlock: 10873070, testStartBlock: null }),
  AggregatorLINK_3: createStartBlock({ prodStartBlock: 10921231, testStartBlock: null }),
  AggregatorBTC_3: createStartBlock({ prodStartBlock: 10921231, testStartBlock: null }),
  AggregatorAUD_3: createStartBlock({ prodStartBlock: 10921231, testStartBlock: null }),
  AggregatorEUR_3: createStartBlock({ prodStartBlock: 10921231, testStartBlock: null }),
  AggregatorBCH_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorEOS_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorBNB_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorADA_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorREN_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorLEND_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorKNC_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorSNX_3: createStartBlock({ prodStartBlock: 10950006, testStartBlock: null }),
  AggregatorDASH_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorETC_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorLTC_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorXMR_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorXRP_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorTRX_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorXTZ_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorCOMP_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorDEFI_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorCEX_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorETH_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorCHF_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorJPY_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorGBP_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorFTSE_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
  AggregatorNIKKEI_3: createStartBlock({ prodStartBlock: 10960006, testStartBlock: null }),
};

const commonRatesABI = 'ExchangeRates';
const commonRatesEntities = ['RatesUpdated'];

const createRates4Block = ({ name, startBlock, address }) => ({
  name,
  mappingFile: '../src/rates-mapping.ts',
  startBlock,
  address,
  abi: commonRatesABI,
  entities: commonRatesEntities,
  abis: [
    {
      name: 'ExchangeRates',
      path: '../abis/ExchangeRates_bytes4.json',
    },
  ],
  events: [
    {
      event: 'RatesUpdated(bytes4[],uint256[])',
      handler: 'handleRatesUpdated',
    },
  ],
});

const createRates32Block = ({ name, startBlock, address }) => ({
  name,
  mappingFile: '../src/rates-mapping.ts',
  startBlock,
  address,
  abi: commonRatesABI,
  entities: commonRatesEntities,
  abis: [
    {
      name: 'ExchangeRates',
      path: '../abis/ExchangeRates_bytes32.json',
    },
  ],
  events: [
    {
      event: 'RatesUpdated(bytes32[],uint256[])',
      handler: 'handleRatesUpdated',
    },
  ],
});

const createAggregatorBlock = ({ name, startBlock, address }) => ({
  name,
  mappingFile: '../src/rates-mapping.ts',
  startBlock,
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

module.exports = [
  createRates4Block({
    name: 'ExchangeRates_v231',
    startBlock: StartBlocks.ExchangeRates_v231,
    address: "'0xba34e436C9383aa8FA1e3659D2807ae040592498'",
  }),
  createRates4Block({
    name: 'ExchangeRates_v240',
    startBlock: StartBlocks.ExchangeRates_v240,
    address: "'0x5cBB53Ca85A9E52B593Baf8ae90282C4B3dB0b25'",
  }),
  createRates4Block({
    name: 'ExchangeRates_v272',
    startBlock: StartBlocks.ExchangeRates_v272,
    address: "'0x70C629875daDBE702489a5E1E3bAaE60e38924fa'",
  }),
  createRates32Block({
    name: 'ExchangeRates_v210',
    startBlock: StartBlocks.ExchangeRates_v210,
    address: "'0x99a46c42689720d9118ff7af7ce80c2a92fc4f97'",
  }),
  createRates32Block({
    name: 'ExchangeRates_v213',
    startBlock: StartBlocks.ExchangeRates_v213,
    address: "'0x565C9EB432f4AE9633e50e1213AB4f23D8f31f54'",
  }),
  createRates32Block({
    name: 'ExchangeRates_v217',
    startBlock: StartBlocks.ExchangeRates_v217,
    address: "'0xE95Ef4e7a04d2fB05cb625c62CA58da10112c605'",
  }),
  createRates32Block({
    name: 'ExchangeRates_v219',
    startBlock: StartBlocks.ExchangeRates_v219,
    address: "'0x9D7F70AF5DF5D5CC79780032d47a34615D1F1d77'",
  }),
  {
    name: 'ExchangeRates_v223',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: StartBlocks.ExchangeRates_v223,
    address: "'0xba727c69636491ecdfE3E6F64cBE9428aD371e48'",
    abi: commonRatesABI,
    entities: commonRatesEntities,
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_v2.23.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: StartBlocks.ExchangeRates,
    address: "'0xba727c69636491ecdfE3E6F64cBE9428aD371e48'",
    abi: commonRatesABI,
    entities: commonRatesEntities,
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  createAggregatorBlock({
    name: 'AggregatorAUD',
    startBlock: StartBlocks.AggregatorAUD,
    address: "'0x05cf62c4ba0ccea3da680f9a8744ac51116d6231'",
  }),
  createAggregatorBlock({
    name: 'AggregatorEUR',
    startBlock: StartBlocks.AggregatorEUR,
    address: "'0x25fa978ea1a7dc9bdc33a2959b9053eae57169b5'",
  }),
  createAggregatorBlock({
    name: 'AggregatorCHF',
    startBlock: StartBlocks.AggregatorCHF,
    address: "'0x02d5c618dbc591544b19d0bf13543c0728a3c4ec'",
  }),
  createAggregatorBlock({
    name: 'AggregatorGBP',
    startBlock: StartBlocks.AggregatorGBP,
    address: "'0x151445852b0cfdf6a4cc81440f2af99176e8ad08'",
  }),
  createAggregatorBlock({
    name: 'AggregatorJPY',
    startBlock: StartBlocks.AggregatorJPY,
    address: "'0xe1407bfaa6b5965bad1c9f38316a3b655a09d8a6'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXAG',
    startBlock: StartBlocks.AggregatorXAG,
    address: "'0x8946a183bfafa95becf57c5e08fe5b7654d2807b'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXAU',
    startBlock: StartBlocks.AggregatorXAU,
    address: "'0xafce0c7b7fe3425adb3871eae5c0ec6d93e01935'",
  }),
  createAggregatorBlock({
    name: 'AggregatorFTSE',
    startBlock: StartBlocks.AggregatorFTSE,
    address: "'0x16924ae9c2ac6cdbc9d6bb16fafcd38bed560936'",
  }),
  createAggregatorBlock({
    name: 'AggregatorN225',
    startBlock: StartBlocks.AggregatorN225,
    address: "'0x3f6e09a4ec3811765f5b2ad15c0279910dbb2c04'",
  }),
  createAggregatorBlock({
    name: 'AggregatorSNX',
    startBlock: StartBlocks.AggregatorSNX,
    address: "'0xd3ce735cdc708d9607cfbc6c3429861625132cb4'",
  }),
  createAggregatorBlock({
    name: 'AggregatorETH',
    startBlock: StartBlocks.AggregatorETH,
    address: "'0xf79d6afbb6da890132f9d7c355e3015f15f3406f'",
  }),
  createAggregatorBlock({
    name: 'AggregatorCOMP',
    startBlock: StartBlocks.AggregatorCOMP,
    address: "'0x80eeb41e2a86d4ae9903a3860dd643dad2d1a853'",
  }),
  createAggregatorBlock({
    name: 'AggregatorKNC',
    startBlock: StartBlocks.AggregatorKNC,
    address: "'0x45e9fee61185e213c37fc14d18e44ef9262e10db'",
  }),
  createAggregatorBlock({
    name: 'AggregatorLEND',
    startBlock: StartBlocks.AggregatorLEND,
    address: "'0x2408935efe60f092b442a8755f7572edb9cf971e'",
  }),
  createAggregatorBlock({
    name: 'AggregatorREN',
    startBlock: StartBlocks.AggregatorREN,
    address: "'0x353f61f39a17e56ca413f4559b8cd3b6a252ffc8'",
  }),
  createAggregatorBlock({
    name: 'AggregatorBTC',
    startBlock: StartBlocks.AggregatorBTC,
    address: "'0xf5fff180082d6017036b771ba883025c654bc935'",
  }),
  createAggregatorBlock({
    name: 'AggregatorBNB',
    startBlock: StartBlocks.AggregatorBNB,
    address: "'0x0821f21f21c325ae39557ca83b6b4df525495d06'",
  }),
  createAggregatorBlock({
    name: 'AggregatorTRX',
    startBlock: StartBlocks.AggregatorTRX,
    address: "'0x28e0fd8e05c14034cba95c6bf3394d1b106f7ed8'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXTZ',
    startBlock: StartBlocks.AggregatorXTZ,
    address: "'0x52d674c76e91c50a0190de77da1fad67d859a569'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXRP',
    startBlock: StartBlocks.AggregatorXRP,
    address: "'0x570985649832b51786a181d57babe012be1c09a4'",
  }),
  createAggregatorBlock({
    name: 'AggregatorLTC',
    startBlock: StartBlocks.AggregatorLTC,
    address: "'0xc6ee0d4943dc43bd462145aa6ac95e9c0c8b462f'",
  }),
  createAggregatorBlock({
    name: 'AggregatorLINK',
    startBlock: StartBlocks.AggregatorLINK,
    address: "'0x32dbd3214ac75223e27e575c53944307914f7a90'",
  }),
  createAggregatorBlock({
    name: 'AggregatorEOS',
    startBlock: StartBlocks.AggregatorEOS,
    address: "'0x740be5e8fe30bd2bf664822154b520eae0c565b0'",
  }),
  createAggregatorBlock({
    name: 'AggregatorBCH',
    startBlock: StartBlocks.AggregatorBCH,
    address: "'0x6a6527d91ddae0a259cc09dad311b3455cdc1fbd'",
  }),
  createAggregatorBlock({
    name: 'AggregatorETC',
    startBlock: StartBlocks.AggregatorETC,
    address: "'0xe2c9aea66ed352c33f9c7d8e824b7cac206b0b72'",
  }),
  createAggregatorBlock({
    name: 'AggregatorDASH',
    startBlock: StartBlocks.AggregatorDASH,
    address: "'0xd9d35a82d4dd43be7cfc524ebf5cd00c92c48ebc'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXMR',
    startBlock: StartBlocks.AggregatorXMR,
    address: "'0xd1e850d6afb6c27a3d66a223f6566f0426a6e13b'",
  }),
  createAggregatorBlock({
    name: 'AggregatorADA',
    startBlock: StartBlocks.AggregatorADA,
    address: "'0xf11bf075f0b2b8d8442ab99c44362f1353d40b44'",
  }),
  createAggregatorBlock({
    name: 'AggregatorCEX',
    startBlock: StartBlocks.AggregatorCEX,
    address: "'0x46bb139f23b01fef37cb95ae56274804bc3b3e86'",
  }),
  createAggregatorBlock({
    name: 'AggregatorDEFI',
    startBlock: StartBlocks.AggregatorDEFI,
    address: "'0x7ae7781c7f3a5182596d161e037e6db8e36328ef'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXAU_3',
    startBlock: StartBlocks.AggregatorXAU_3,
    address: "'0x06A7689149cf04DacFDE555d1e1EAD7dD7370316'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXAG_3',
    startBlock: StartBlocks.AggregatorXAG_3,
    address: "'0xF320E19B2ED82F1B226b006cD43FE600FEA56615'",
  }),
  createAggregatorBlock({
    name: 'AggregatorLINK_3',
    startBlock: StartBlocks.AggregatorLINK_3,
    address: "'0x8cDE021F0BfA5f82610e8cE46493cF66AC04Af53'",
  }),
  createAggregatorBlock({
    name: 'AggregatorBTC_3',
    startBlock: StartBlocks.AggregatorBTC_3,
    address: "'0xF570deEffF684D964dc3E15E1F9414283E3f7419'",
  }),
  createAggregatorBlock({
    name: 'AggregatorAUD_3',
    startBlock: StartBlocks.AggregatorAUD_3,
    address: "'0x3A33c0eFD0EB8fd38a6E1904dF1E32f95F67616b'",
  }),
  createAggregatorBlock({
    name: 'AggregatorEUR_3',
    startBlock: StartBlocks.AggregatorEUR_3,
    address: "'0x8f71c9c583248A11CAcBbC8FD0D5dFa483D3b109'",
  }),
  createAggregatorBlock({
    name: 'AggregatorBCH_3',
    startBlock: StartBlocks.AggregatorBCH_3,
    address: "'0x744704c31a2E46AD60c7CDf0212933B4c4c2c9eC'",
  }),
  createAggregatorBlock({
    name: 'AggregatorEOS_3',
    startBlock: StartBlocks.AggregatorEOS_3,
    address: "'0x7C9Ca5AdcBa43D968D9e0dDcA16293D66c07482D'",
  }),
  createAggregatorBlock({
    name: 'AggregatorBNB_3',
    startBlock: StartBlocks.AggregatorBNB_3,
    address: "'0x90888CDDaD598570c6eDC443eee9aaDB63cDA3C4'",
  }),
  createAggregatorBlock({
    name: 'AggregatorADA_3',
    startBlock: StartBlocks.AggregatorADA_3,
    address: "'0xf94800E6e36b0dc860F6f31e7cDf1086099E8c0E'",
  }),
  createAggregatorBlock({
    name: 'AggregatorREN_3',
    startBlock: StartBlocks.AggregatorREN_3,
    address: "'0xD286AF227B7b0695387E279B9956540818B1dc2a'",
  }),
  createAggregatorBlock({
    name: 'AggregatorLEND_3',
    startBlock: StartBlocks.AggregatorLEND_3,
    address: "'0x0227fb846b48e209d56D79b0A3109FdA561db821'",
  }),
  createAggregatorBlock({
    name: 'AggregatorKNC_3',
    startBlock: StartBlocks.AggregatorKNC_3,
    address: "'0xa811Ff165b082c0507Ce9a5a660Fb3D7eEeCb88A'",
  }),
  createAggregatorBlock({
    name: 'AggregatorSNX_3',
    startBlock: StartBlocks.AggregatorSNX_3,
    address: "'0xC8DB8d5869510Bb1FCd3Bd7C7624c1b49c652ef8'",
  }),
  createAggregatorBlock({
    name: 'AggregatorDASH_3',
    startBlock: StartBlocks.AggregatorDASH_3,
    address: "'0x1fB0b88eaF51420c14B67256Ab7DaE1de6e116cb'",
  }),
  createAggregatorBlock({
    name: 'AggregatorETC_3',
    startBlock: StartBlocks.AggregatorETC_3,
    address: "'0x41306Eb5fC11A68C284c19Ba3B9510c0252E0a34'",
  }),
  createAggregatorBlock({
    name: 'AggregatorLTC_3',
    startBlock: StartBlocks.AggregatorLTC_3,
    address: "'0x3F2d1Ff4930318B5a7c301E1bf7e703DcF6D83E3'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXMR_3',
    startBlock: StartBlocks.AggregatorXMR_3,
    address: "'0x38cB8642A0FC558918fCed939450D689d0E5a7Be'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXRP_3',
    startBlock: StartBlocks.AggregatorXRP_3,
    address: "'0x75Ed2f61837c3D9Ef1BF0af4DB84664DC6fe56bC'",
  }),
  createAggregatorBlock({
    name: 'AggregatorTRX_3',
    startBlock: StartBlocks.AggregatorTRX_3,
    address: "'0x4D35fE9C85233a8E00aE2d3C0d912a45Bc781025'",
  }),
  createAggregatorBlock({
    name: 'AggregatorXTZ_3',
    startBlock: StartBlocks.AggregatorXTZ_3,
    address: "'0x7391BB54a24719DA7DD81c2E5176cf954D7f7635'",
  }),
  createAggregatorBlock({
    name: 'AggregatorCOMP_3',
    startBlock: StartBlocks.AggregatorCOMP_3,
    address: "'0x150631a2e822d3ed7D46df9A270ce7134a16De89'",
  }),
  createAggregatorBlock({
    name: 'AggregatorDEFI_3',
    startBlock: StartBlocks.AggregatorDEFI_3,
    address: "'0x25367741a23464b41B4aB978Bd8092d56a3590C0'",
  }),
  createAggregatorBlock({
    name: 'AggregatorCEX_3',
    startBlock: StartBlocks.AggregatorCEX_3,
    address: "'0xBC66D51898dd2EFA3C214C87d4645C0478Ccbc95'",
  }),
  createAggregatorBlock({
    name: 'AggregatorETH_3',
    startBlock: StartBlocks.AggregatorETH_3,
    address: "'0x00c7A37B03690fb9f41b5C5AF8131735C7275446'",
  }),
  createAggregatorBlock({
    name: 'AggregatorCHF_3',
    startBlock: StartBlocks.AggregatorCHF_3,
    address: "'0xdf005CaD29AAC8b1170960807f99B62aaeD1bb0a'",
  }),
  createAggregatorBlock({
    name: 'AggregatorJPY_3',
    startBlock: StartBlocks.AggregatorJPY_3,
    address: "'0x87CFEA02C8322653a7335C6f72Be19ce54ECbFb5'",
  }),
  createAggregatorBlock({
    name: 'AggregatorGBP_3',
    startBlock: StartBlocks.AggregatorGBP_3,
    address: "'0x3a6e27b663593E34a7FB80bA9544d9E8BAbdF001'",
  }),
  createAggregatorBlock({
    name: 'AggregatorFTSE_3',
    startBlock: StartBlocks.AggregatorFTSE_3,
    address: "'0xc95B41df94F3890122B2bcEf9005AFDe17773dB2'",
  }),
  createAggregatorBlock({
    name: 'AggregatorNIKKEI_3',
    startBlock: StartBlocks.AggregatorNIKKEI_3,
    address: "'0x4Fa0655c09E0b5B2F50F1bd861B2d9BC63ccBBCB'",
  }),
];
