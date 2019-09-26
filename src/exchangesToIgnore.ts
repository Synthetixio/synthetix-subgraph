// transactions to ignore: these were part of the oracle issue on June 24, 2019 where a bot
// traded on an error with KRW pricing.
export const exchangesToIgnore: string[] = [
  '0xfc394ccdc54e4a16f10e41abedf1e9687017d2d92fb910872df7a008441fcdb7',
  '0x2fecbd27a9ab11f4168e84fe9058696c5654f85291079adb023e5ee49ce9b453',
  '0x3b22d34d5bf672b4aa8d85c1f560d0b592a57f885bbbd44d55655b480a598e65',
  '0x3bc868625212fc45baa9d43c8a04763d2d5130c4358bcd76712fd7dfb391f88d',
  '0x0347037683e6164b7e88a6c5638ee24bf2e0a0cc5512123969ed85542fa51f0f',
  '0xd68199987b6c457f783a5daeddb4154526003401125ab76cd9b6486be8944174',
  '0x93819f6bbea390d7709fa033f5733d16418674e99c43b9ed23adb4110d657f0c',

  // this final txn was the agreed upon trade back into an artifically lowered synth by the
  // bot owner for an ETH bounty.
  '0xc3fc19c63e1090eb624212bad71a27cd3dc7afcd0cf9063d24bfc47b5d036ae2',
];
