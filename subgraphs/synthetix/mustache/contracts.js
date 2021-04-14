const { addAddress, addStartBlock } = require('../../utils/helpers');
const UNIVERSAL_START_BLOCKS = {
  mainnet: null,
  optimism: null,
  kovan: null,
  'optimism-kovan': null,
};
// NOTE in the next iteration, we can work on the automation of this file
module.exports = {
  Synthetix: {
    address: addAddress({
      mainnet: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
      optimism: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4',
      kovan: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
      'optimism-kovan': '0x0064A673267696049938AA47595dD0B3C2e705A1',
    }),
    startBlock: addStartBlock({
      mainnet: UNIVERSAL_START_BLOCKS.mainnet || '8314597',
      optimism: UNIVERSAL_START_BLOCKS.optimism,
      kovan: UNIVERSAL_START_BLOCKS.kovan,
      'optimism-kovan': UNIVERSAL_START_BLOCKS['optimism-kovan'],
    }),
  },
  SynthsUSD_proxy: {
    address: addAddress({
      mainnet: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
      optimism: '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9',
      kovan: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
      'optimism-kovan': '0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57',
    }),
    startBlock: addStartBlock({
      mainnet: UNIVERSAL_START_BLOCKS.mainnet || '8621971',
      optimism: UNIVERSAL_START_BLOCKS.optimism,
      kovan: UNIVERSAL_START_BLOCKS.kovan,
      'optimism-kovan': UNIVERSAL_START_BLOCKS['optimism-kovan'],
    }),
  },
  RewardEscrow: {
    address: addAddress({
      mainnet: '0xb671F2210B1F6621A2607EA63E6B2DC3e2464d1F',
      optimism: '0xd32138018210edA0028240638f35b70ECC0D8C22',
      kovan: '0x8c6680412e914932A9abC02B6c7cbf690e583aFA',
      'optimism-kovan': '0x9952e42fF92149f48b3b7dee3f921A6DD106F79F',
    }),
    startBlock: addStartBlock({
      mainnet: UNIVERSAL_START_BLOCKS.mainnet || '7680399',
      optimism: UNIVERSAL_START_BLOCKS.optimism,
      kovan: UNIVERSAL_START_BLOCKS.kovan,
      'optimism-kovan': UNIVERSAL_START_BLOCKS['optimism-kovan'],
    }),
  },
  RewardEscrowV2: {
    address: addAddress({
      mainnet: '0xDA4eF8520b1A57D7d63f1E249606D1A459698876',
      optimism: '0x47eE58801C1AC44e54FF2651aE50525c5cfc66d0',
      kovan: '0x64ac15AB583fFfA6a7401B83E3aA5cf4Ad1aA92A',
      'optimism-kovan': '0xB613d148E47525478bD8A91eF7Cf2F7F63d81858',
    }),
    startBlock: addStartBlock({
      mainnet: UNIVERSAL_START_BLOCKS.mainnet || '11656230',
      optimism: UNIVERSAL_START_BLOCKS.optimism,
      kovan: UNIVERSAL_START_BLOCKS.kovan,
      'optimism-kovan': UNIVERSAL_START_BLOCKS['optimism-kovan'],
    }),
  },
  FeePool: {
    address: addAddress({
      mainnet: '0xb440DD674e1243644791a4AdfE3A2AbB0A92d309',
      optimism: '0x4a16A42407AA491564643E1dfc1fd50af29794eF',
      kovan: '0xc43b833F93C3896472dED3EfF73311f571e38742',
      'optimism-kovan': '0xd8c8887A629F98C56686Be6aEEDAae7f8f75D599',
    }),
    startBlock: addStartBlock({
      mainnet: UNIVERSAL_START_BLOCKS.mainnet || '7680399',
      optimism: UNIVERSAL_START_BLOCKS.optimism,
      kovan: UNIVERSAL_START_BLOCKS.kovan,
      'optimism-kovan': UNIVERSAL_START_BLOCKS['optimism-kovan'],
    }),
  },
};
