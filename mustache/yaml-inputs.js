module.exports = {
  'mainnet-ovm': {
    startBlock: 1,
    network: 'optimism',
    Synthetix: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4',
    SynthsUSD_proxy: '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9',
    RewardEscrow: '0xd32138018210edA0028240638f35b70ECC0D8C22',
    RewardEscrowV2: '0x47eE58801C1AC44e54FF2651aE50525c5cfc66d0',
    FeePool: '0x4a16A42407AA491564643E1dfc1fd50af29794eF',
    Exchanger: '0xe318E4618E5684668992935d7231Cb837a44E670',
    ExchangeRates: '0x631E93A0fb06B5eC6d52c0A2D89a3f9672d6Ba64',
    chainlink: [],
  },
  'kovan-ovm': {
    startBlock: 1,
    network: 'optimism-kovan',
    Synthetix: '0x0064A673267696049938AA47595dD0B3C2e705A1',
    SynthsUSD_proxy: '0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57',
    RewardEscrow: '0x9952e42fF92149f48b3b7dee3f921A6DD106F79F',
    RewardEscrowV2: '0xB613d148E47525478bD8A91eF7Cf2F7F63d81858',
    FeePool: '0xd8c8887A629F98C56686Be6aEEDAae7f8f75D599',
    Exchanger: '0xA3de830b5208851539De8e4FF158D635E8f36FCb',
    ExchangerV2: '0x4AcC0Ba2948F8aB47a4fA734C57B0c3B5a8459f7',
    ExchangeRates: '0x686cbD15BBC680F8261c7502c360Aa44A2593de6',
    chainlink: [
      {
        aggregator: '0xb2397a9247323Ca2F207139401E2D55748a1BA78',
        proxy: '0x81AE7F8fF54070C52f0eB4EB5b8890e1506AA4f4',
        feed: 'BTC / USD',
      },
      {
        aggregator: '0xeef539668BF125b29Cd109BDba864C9BF6247Ac7',
        proxy: '0xCb7895bDC70A1a1Dce69b689FD7e43A627475A06',
        feed: 'ETH / USD',
      },
      {
        aggregator: '0x23B3D7a59B2B79D390C53F0745E342249c040802',
        proxy: '0xb37aA79EBc31B93864Bff2d5390b385bE482897b',
        feed: 'LINK / USD',
      },
      {
        aggregator: '0xd98BEf7fD4C528d6FE97AcB6c322b1531e40c992',
        proxy: '0xd9E9047ED2d6e2130395a2Fe08033e756CC7e288',
        feed: 'SNX / USD',
      },
      {
        aggregator: '0x2F42Ee625893D93E2607a37CfC932d8C7F6043a9',
        proxy: '0x943525fA16039d7Bcc4CAB020a7E23115DC20736',
        feed: 'DEFI / USD',
      },
      {
        aggregator: '0x6CbE4f3C316D8D24946166C0aEeaF346C3FDe487',
        proxy: '0xbac904786e476632e75fC6214C797fA80cce9311',
        feed: 'UNI / USD',
      },
      {
        aggregator: '0x8645eB75898A1e049B624369444600061d46B801',
        proxy: '0xc051eCEaFd546e0Eb915a97F4D0643BEd7F98a11',
        feed: 'AAVE / USD',
      },
      {
        aggregator: '0xCC67978a452588ded1cC70743EB6524F3a73CA49',
        proxy: '0x4bFa8c47f9521B0E8f48C14b3288c2258c538C49',
        feed: 'TSLA / USD',
      },
    ],
  },
};
