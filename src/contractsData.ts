// ---------------------
// Chainlink Aggregators
// ---------------------
export let contracts = new Map<string, string>();
contracts.set(
  // sAUD
  '0x05cf62c4ba0ccea3da680f9a8744ac51116d6231',
  '0x7341554400000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sEUR
  '0x25fa978ea1a7dc9bdc33a2959b9053eae57169b5',
  '0x7345555200000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sCHF
  '0x02d5c618dbc591544b19d0bf13543c0728a3c4ec',
  '0x7343484600000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sGBP
  '0x151445852b0cfdf6a4cc81440f2af99176e8ad08',
  '0x7347425000000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sJPY
  '0xe1407bfaa6b5965bad1c9f38316a3b655a09d8a6',
  '0x734a505900000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sXAG
  '0x8946a183bfafa95becf57c5e08fe5b7654d2807b',
  '0x7358414700000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sXAU
  '0xafce0c7b7fe3425adb3871eae5c0ec6d93e01935',
  '0x7358415500000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sFTSE
  '0x16924ae9c2ac6cdbc9d6bb16fafcd38bed560936',
  '0x7346545345000000000000000000000000000000000000000000000000000000',
);
contracts.set(
  // sNIKKEI
  '0x3f6e09a4ec3811765f5b2ad15c0279910dbb2c04',
  '0x734e494b4b454900000000000000000000000000000000000000000000000000',
);

export let contractsToProxies = new Map<string, string>();
contractsToProxies.set(
  '0x05cf62c4ba0ccea3da680f9a8744ac51116d6231', // AUD
  '0x77F9710E7d0A19669A13c055F62cd80d313dF022',
);
contractsToProxies.set(
  '0x3a33c0efd0eb8fd38a6e1904df1e32f95f67616b', // AUD_3
  '0x77F9710E7d0A19669A13c055F62cd80d313dF022',
);
contractsToProxies.set(
  '0x25fa978ea1a7dc9bdc33a2959b9053eae57169b5', // EUR
  '0xb49f677943BC038e9857d61E7d053CaA2C1734C1',
);
contractsToProxies.set(
  '0x8f71c9c583248a11cacbbc8fd0d5dfa483d3b109', // EUR_3
  '0xb49f677943BC038e9857d61E7d053CaA2C1734C1',
);
contractsToProxies.set(
  '0x02d5c618dbc591544b19d0bf13543c0728a3c4ec', // CHF
  '0x449d117117838fFA61263B61dA6301AA2a88B13A',
);
contractsToProxies.set(
  '0xdf005cad29aac8b1170960807f99b62aaed1bb0a', // CHF_3
  '0x449d117117838fFA61263B61dA6301AA2a88B13A',
);
contractsToProxies.set(
  '0x151445852b0cfdf6a4cc81440f2af99176e8ad08', // GBP
  '0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5',
);
contractsToProxies.set(
  '0x3a6e27b663593e34a7fb80ba9544d9e8babdf001', // GBP_3
  '0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5',
);
contractsToProxies.set(
  '0xe1407bfaa6b5965bad1c9f38316a3b655a09d8a6', // JPY
  '0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3',
);
contractsToProxies.set(
  '0x87cfea02c8322653a7335c6f72be19ce54ecbfb5', // JPY_3
  '0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3',
);
contractsToProxies.set(
  '0x8946a183bfafa95becf57c5e08fe5b7654d2807b', // XAG
  '0x379589227b15F1a12195D3f2d90bBc9F31f95235',
);
contractsToProxies.set(
  '0xf320e19b2ed82f1b226b006cd43fe600fea56615', // XAG_3
  '0x379589227b15F1a12195D3f2d90bBc9F31f95235',
);
contractsToProxies.set(
  '0xafce0c7b7fe3425adb3871eae5c0ec6d93e01935', // XAU
  '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6',
);
contractsToProxies.set(
  '0x06a7689149cf04dacfde555d1e1ead7dd7370316', // XAU_3
  '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6',
);
contractsToProxies.set(
  '0x16924ae9c2ac6cdbc9d6bb16fafcd38bed560936', // FTSE
  '0xE23FA0e8dd05D6f66a6e8c98cab2d9AE82A7550c',
);
contractsToProxies.set(
  '0xc95b41df94f3890122b2bcef9005afde17773db2', // FTSE
  '0xE23FA0e8dd05D6f66a6e8c98cab2d9AE82A7550c',
);
contractsToProxies.set(
  '0x3f6e09a4ec3811765f5b2ad15c0279910dbb2c04', // NIKKEI225
  '0x5c4939a2ab3A2a9f93A518d81d4f8D0Bc6a68980',
);
contractsToProxies.set(
  '0x4fa0655c09e0b5b2f50f1bd861b2d9bc63ccbbcb', // NIKKEI225_3
  '0x5c4939a2ab3A2a9f93A518d81d4f8D0Bc6a68980',
);
contractsToProxies.set(
  '0xd3ce735cdc708d9607cfbc6c3429861625132cb4', // SNX
  '0xDC3EA94CD0AC27d9A86C180091e7f78C683d3699',
);
contractsToProxies.set(
  '0xc8db8d5869510bb1fcd3bd7c7624c1b49c652ef8', // SNX_3
  '0xDC3EA94CD0AC27d9A86C180091e7f78C683d3699',
);
contractsToProxies.set(
  '0xf79d6afbb6da890132f9d7c355e3015f15f3406f', // ETH
  '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
);
contractsToProxies.set(
  '0x00c7a37b03690fb9f41b5c5af8131735c7275446', // ETH_3
  '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
);
contractsToProxies.set(
  '0x80eeb41e2a86d4ae9903a3860dd643dad2d1a853', // COMP
  '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
);
contractsToProxies.set(
  '0x150631a2e822d3ed7d46df9a270ce7134a16de89', // COMP_3
  '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
);
contractsToProxies.set(
  '0x45e9fee61185e213c37fc14d18e44ef9262e10db', // KNC
  '0xf8fF43E991A81e6eC886a3D281A2C6cC19aE70Fc',
);
contractsToProxies.set(
  '0xa811ff165b082c0507ce9a5a660fb3d7eeecb88a', // KNC_3
  '0xf8fF43E991A81e6eC886a3D281A2C6cC19aE70Fc',
);
contractsToProxies.set(
  '0x2408935efe60f092b442a8755f7572edb9cf971e', // LEND
  '0x4aB81192BB75474Cf203B56c36D6a13623270A67',
);
contractsToProxies.set(
  '0x0227fb846b48e209d56d79b0a3109fda561db821', // LEND_3
  '0x4aB81192BB75474Cf203B56c36D6a13623270A67',
);
contractsToProxies.set(
  '0x353f61f39a17e56ca413f4559b8cd3b6a252ffc8', // REN
  '0x0f59666EDE214281e956cb3b2D0d69415AfF4A01',
);
contractsToProxies.set(
  '0xd286af227b7b0695387e279b9956540818b1dc2a', // REN_3
  '0x0f59666EDE214281e956cb3b2D0d69415AfF4A01',
);
contractsToProxies.set(
  '0xf5fff180082d6017036b771ba883025c654bc935', // BTC
  '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
);
contractsToProxies.set(
  '0xf570deefff684d964dc3e15e1f9414283e3f7419', // BTC_3
  '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
);
contractsToProxies.set(
  '0x0821f21f21c325ae39557ca83b6b4df525495d06', // BNB
  '0x14e613AC84a31f709eadbdF89C6CC390fDc9540A',
);
contractsToProxies.set(
  '0x90888cddad598570c6edc443eee9aadb63cda3c4', // BNB_3
  '0x14e613AC84a31f709eadbdF89C6CC390fDc9540A',
);
contractsToProxies.set(
  '0x28e0fd8e05c14034cba95c6bf3394d1b106f7ed8', // TRX
  '0xacD0D1A29759CC01E8D925371B72cb2b5610EA25',
);
contractsToProxies.set(
  '0x4d35fe9c85233a8e00ae2d3c0d912a45bc781025', // TRX_3
  '0xacD0D1A29759CC01E8D925371B72cb2b5610EA25',
);
contractsToProxies.set(
  '0x52d674c76e91c50a0190de77da1fad67d859a569', // XTZ
  '0x5239a625dEb44bF3EeAc2CD5366ba24b8e9DB63F',
);
contractsToProxies.set(
  '0x7391bb54a24719da7dd81c2e5176cf954d7f7635', // XTZ_3
  '0x5239a625dEb44bF3EeAc2CD5366ba24b8e9DB63F',
);
contractsToProxies.set(
  '0x570985649832b51786a181d57babe012be1c09a4', // XRP
  '0xCed2660c6Dd1Ffd856A5A82C67f3482d88C50b12',
);
contractsToProxies.set(
  '0x75ed2f61837c3d9ef1bf0af4db84664dc6fe56bc', // XRP_3
  '0xCed2660c6Dd1Ffd856A5A82C67f3482d88C50b12',
);
contractsToProxies.set(
  '0xc6ee0d4943dc43bd462145aa6ac95e9c0c8b462f', // LTC
  '0x6AF09DF7563C363B5763b9102712EbeD3b9e859B',
);
contractsToProxies.set(
  '0x3f2d1ff4930318b5a7c301e1bf7e703dcf6d83e3', // LTC_3
  '0x6AF09DF7563C363B5763b9102712EbeD3b9e859B',
);
contractsToProxies.set(
  '0x32dbd3214ac75223e27e575c53944307914f7a90', // LINK
  '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
);
contractsToProxies.set(
  '0x8cde021f0bfa5f82610e8ce46493cf66ac04af53', // LINK_3
  '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
);
contractsToProxies.set(
  '0x740be5e8fe30bd2bf664822154b520eae0c565b0', // EOS
  '0x10a43289895eAff840E8d45995BBa89f9115ECEe',
);
contractsToProxies.set(
  '0x7c9ca5adcba43d968d9e0ddca16293d66c07482d', // EOS_3
  '0x10a43289895eAff840E8d45995BBa89f9115ECEe',
);
contractsToProxies.set(
  '0x6a6527d91ddae0a259cc09dad311b3455cdc1fbd', // BCH
  '0x9F0F69428F923D6c95B781F89E165C9b2df9789D',
);
contractsToProxies.set(
  '0x744704c31a2e46ad60c7cdf0212933b4c4c2c9ec', // BCH_3
  '0x9F0F69428F923D6c95B781F89E165C9b2df9789D',
);
contractsToProxies.set(
  '0xe2c9aea66ed352c33f9c7d8e824b7cac206b0b72', // ETC
  '0xaEA2808407B7319A31A383B6F8B60f04BCa23cE2',
);
contractsToProxies.set(
  '0x41306eb5fc11a68c284c19ba3b9510c0252e0a34', // ETC_3
  '0xaEA2808407B7319A31A383B6F8B60f04BCa23cE2',
);
contractsToProxies.set(
  '0xd9d35a82d4dd43be7cfc524ebf5cd00c92c48ebc', // DASH
  '0xFb0cADFEa136E9E343cfb55B863a6Df8348ab912',
);
contractsToProxies.set(
  '0x1fb0b88eaf51420c14b67256ab7dae1de6e116cb', // DASH_3
  '0xFb0cADFEa136E9E343cfb55B863a6Df8348ab912',
);
contractsToProxies.set(
  '0xd1e850d6afb6c27a3d66a223f6566f0426a6e13b', // XMR
  '0xFA66458Cce7Dd15D8650015c4fce4D278271618F',
);
contractsToProxies.set(
  '0x38cb8642a0fc558918fced939450d689d0e5a7be', // XMR_3
  '0xFA66458Cce7Dd15D8650015c4fce4D278271618F',
);
contractsToProxies.set(
  '0xf11bf075f0b2b8d8442ab99c44362f1353d40b44', // ADA
  '0xAE48c91dF1fE419994FFDa27da09D5aC69c30f55',
);
contractsToProxies.set(
  '0xf94800e6e36b0dc860f6f31e7cdf1086099e8c0e', // ADA_3
  '0xAE48c91dF1fE419994FFDa27da09D5aC69c30f55',
);
contractsToProxies.set(
  '0x46bb139f23b01fef37cb95ae56274804bc3b3e86', // CEX
  '0x283D433435cFCAbf00263beEF6A362b7cc5ed9f2',
);
contractsToProxies.set(
  '0xbc66d51898dd2efa3c214c87d4645c0478ccbc95', // CEX_3
  '0x283D433435cFCAbf00263beEF6A362b7cc5ed9f2',
);
contractsToProxies.set(
  '0x7ae7781c7f3a5182596d161e037e6db8e36328ef', // DEFI
  '0xa8E875F94138B0C5b51d1e1d5dE35bbDdd28EA87',
);
contractsToProxies.set(
  '0x25367741a23464b41b4ab978bd8092d56a3590c0', // DEFI_3
  '0xa8E875F94138B0C5b51d1e1d5dE35bbDdd28EA87',
);
