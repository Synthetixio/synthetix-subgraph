const { addNetworkData } = require('../../utils/helpers');
// NOTE in the next iteration, we can work on the automation of this file
module.exports = {
  // NOTE changing this field will use this start block for all entries in the yaml file
  networks: ['kovan', 'optimism', 'optimism-kovan', 'mainnet'],
  universalStartBlock: null,
  Synthetix: {
    address: addNetworkData({
      mainnet: '0x0',
      optimism: '0x1',
      kovan: '0x2',
      'optimism-kovan': '0x3',
    }),
    startBlock: addNetworkData({ startBlock: '1' }),
  },
};
