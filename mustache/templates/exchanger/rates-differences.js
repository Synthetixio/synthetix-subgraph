const { createStartBlock } = require('../common');
/**
 * DO NOT commit a change to any of the null values in this file.
 * You may change them for testing and syncing the Graph faster but
 * leave them as null in your commits
 */
const universalTestBlock = null;

/**
 * NOTE this file will overwrite the rates data for the exchanger yaml file
 * To modify the start blocks for test syncing you can simply use
 * the universal test block above or fill out each one individually
 * by changing the null value for test in createStartBlock
 * process.env.TEST_YAML is a safety check in createStartBlock in case
 * someone commits a non null value to prevent prod values from being overwritten
 */
const StartBlocks = {
  BlockOne: createStartBlock({ prod: 10537958, test: null, universalTestBlock }),
  BlockTwo: createStartBlock({ prod: 10773070, test: null, universalTestBlock }),
  BlockThree: createStartBlock({ prod: 10873070, test: null, universalTestBlock }),
  BlockFour: createStartBlock({ prod: 10921231, test: null, universalTestBlock }),
  BlockFive: createStartBlock({ prod: 10950006, test: null, universalTestBlock }),
  BlockSix: createStartBlock({ prod: 10960006, test: null, universalTestBlock }),
};

module.exports = {
  '0xba34e436C9383aa8FA1e3659D2807ae040592498': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x5cBB53Ca85A9E52B593Baf8ae90282C4B3dB0b25': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x70C629875daDBE702489a5E1E3bAaE60e38924fa': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x99a46c42689720d9118ff7af7ce80c2a92fc4f97': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x565C9EB432f4AE9633e50e1213AB4f23D8f31f54': {
    startBlock: StartBlocks.BlockOne,
  },
  '0xE95Ef4e7a04d2fB05cb625c62CA58da10112c605': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x9D7F70AF5DF5D5CC79780032d47a34615D1F1d77': {
    startBlock: StartBlocks.BlockOne,
  },
  '0xba727c69636491ecdfE3E6F64cBE9428aD371e48': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x05cf62c4ba0ccea3da680f9a8744ac51116d6231': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x25fa978ea1a7dc9bdc33a2959b9053eae57169b5': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x02d5c618dbc591544b19d0bf13543c0728a3c4ec': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x151445852b0cfdf6a4cc81440f2af99176e8ad08': {
    startBlock: StartBlocks.BlockOne,
  },
  '0xe1407bfaa6b5965bad1c9f38316a3b655a09d8a6': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x8946a183bfafa95becf57c5e08fe5b7654d2807b': {
    startBlock: StartBlocks.BlockOne,
  },
  '0xafce0c7b7fe3425adb3871eae5c0ec6d93e01935': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x16924ae9c2ac6cdbc9d6bb16fafcd38bed560936': {
    startBlock: StartBlocks.BlockOne,
  },
  '0x3f6e09a4ec3811765f5b2ad15c0279910dbb2c04': {
    startBlock: StartBlocks.BlockOne,
  },
  '0xd3ce735cdc708d9607cfbc6c3429861625132cb4': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xf79d6afbb6da890132f9d7c355e3015f15f3406f': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x80eeb41e2a86d4ae9903a3860dd643dad2d1a853': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x45e9fee61185e213c37fc14d18e44ef9262e10db': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x2408935efe60f092b442a8755f7572edb9cf971e': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x353f61f39a17e56ca413f4559b8cd3b6a252ffc8': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xf5fff180082d6017036b771ba883025c654bc935': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x0821f21f21c325ae39557ca83b6b4df525495d06': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x28e0fd8e05c14034cba95c6bf3394d1b106f7ed8': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x52d674c76e91c50a0190de77da1fad67d859a569': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x570985649832b51786a181d57babe012be1c09a4': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xc6ee0d4943dc43bd462145aa6ac95e9c0c8b462f': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x32dbd3214ac75223e27e575c53944307914f7a90': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x740be5e8fe30bd2bf664822154b520eae0c565b0': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x6a6527d91ddae0a259cc09dad311b3455cdc1fbd': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xe2c9aea66ed352c33f9c7d8e824b7cac206b0b72': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xd9d35a82d4dd43be7cfc524ebf5cd00c92c48ebc': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xd1e850d6afb6c27a3d66a223f6566f0426a6e13b': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0xf11bf075f0b2b8d8442ab99c44362f1353d40b44': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x46bb139f23b01fef37cb95ae56274804bc3b3e86': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x7ae7781c7f3a5182596d161e037e6db8e36328ef': {
    startBlock: StartBlocks.BlockTwo,
  },
  '0x06A7689149cf04DacFDE555d1e1EAD7dD7370316': {
    startBlock: StartBlocks.BlockThree,
  },
  '0xF320E19B2ED82F1B226b006cD43FE600FEA56615': {
    startBlock: StartBlocks.BlockThree,
  },
  '0x8cDE021F0BfA5f82610e8cE46493cF66AC04Af53': {
    startBlock: StartBlocks.BlockFour,
  },
  '0xF570deEffF684D964dc3E15E1F9414283E3f7419': {
    startBlock: StartBlocks.BlockFour,
  },
  '0x3A33c0eFD0EB8fd38a6E1904dF1E32f95F67616b': {
    startBlock: StartBlocks.BlockFour,
  },
  '0x8f71c9c583248A11CAcBbC8FD0D5dFa483D3b109': {
    startBlock: StartBlocks.BlockFour,
  },
  '0x744704c31a2E46AD60c7CDf0212933B4c4c2c9eC': {
    startBlock: StartBlocks.BlockFive,
  },
  '0x7C9Ca5AdcBa43D968D9e0dDcA16293D66c07482D': {
    startBlock: StartBlocks.BlockFive,
  },
  '0x90888CDDaD598570c6eDC443eee9aaDB63cDA3C4': {
    startBlock: StartBlocks.BlockFive,
  },
  '0xf94800E6e36b0dc860F6f31e7cDf1086099E8c0E': {
    startBlock: StartBlocks.BlockFive,
  },
  '0xD286AF227B7b0695387E279B9956540818B1dc2a': {
    startBlock: StartBlocks.BlockFive,
  },
  '0x0227fb846b48e209d56D79b0A3109FdA561db821': {
    startBlock: StartBlocks.BlockFive,
  },
  '0xa811Ff165b082c0507Ce9a5a660Fb3D7eEeCb88A': {
    startBlock: StartBlocks.BlockFive,
  },
  '0xC8DB8d5869510Bb1FCd3Bd7C7624c1b49c652ef8': {
    startBlock: StartBlocks.BlockFive,
  },
  '0x1fB0b88eaF51420c14B67256Ab7DaE1de6e116cb': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x41306Eb5fC11A68C284c19Ba3B9510c0252E0a34': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x3F2d1Ff4930318B5a7c301E1bf7e703DcF6D83E3': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x38cB8642A0FC558918fCed939450D689d0E5a7Be': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x75Ed2f61837c3D9Ef1BF0af4DB84664DC6fe56bC': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x4D35fE9C85233a8E00aE2d3C0d912a45Bc781025': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x7391BB54a24719DA7DD81c2E5176cf954D7f7635': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x150631a2e822d3ed7D46df9A270ce7134a16De89': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x25367741a23464b41B4aB978Bd8092d56a3590C0': {
    startBlock: StartBlocks.BlockSix,
  },
  '0xBC66D51898dd2EFA3C214C87d4645C0478Ccbc95': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x00c7A37B03690fb9f41b5C5AF8131735C7275446': {
    startBlock: StartBlocks.BlockSix,
  },
  '0xdf005CaD29AAC8b1170960807f99B62aaeD1bb0a': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x87CFEA02C8322653a7335C6f72Be19ce54ECbFb5': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x3a6e27b663593E34a7FB80bA9544d9E8BAbdF001': {
    startBlock: StartBlocks.BlockSix,
  },
  '0xc95B41df94F3890122B2bcEf9005AFDe17773dB2': {
    startBlock: StartBlocks.BlockSix,
  },
  '0x4Fa0655c09E0b5B2F50F1bd861B2d9BC63ccBBCB': {
    startBlock: StartBlocks.BlockSix,
  },
};
