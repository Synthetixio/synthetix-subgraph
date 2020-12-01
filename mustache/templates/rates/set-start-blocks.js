const Exchanger = require('../exchanger/set-start-blocks');

const duplicateRateBlocks = {
  one: 10773070,
  two: 10873070,
  three: 10921231,
  four: 10950006,
  five: 10960006,
};

module.exports = {
  ExchangeRates_v231: {
    prod: 7626469,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v240: {
    prod: 8075694,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v272: {
    prod: 8120141,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v210: {
    prod: 8622895,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v213: {
    prod: 8971442,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v217: {
    prod: 9123410,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v219: {
    prod: 9518289,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates_v223: {
    prod: 10364342,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  ExchangeRates: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorAUD: {
    prod: 9085450,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorEUR: {
    prod: 9085417,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorCHF: {
    prod: 9085502,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorGBP: {
    prod: 9085494,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorJPY: {
    prod: 9085433,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorXAG: {
    prod: 9085563,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorXAU: {
    prod: 9085543,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorFTSE: {
    prod: 9755177,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorN225: {
    prod: 9755246,
    test: null,
    exchanger: Exchanger.RatesBlockOne,
  },
  AggregatorSNX: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorETH: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorCOMP: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorKNC: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorLEND: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorREN: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorBTC: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorBNB: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorTRX: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorXTZ: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorXRP: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorLTC: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorLINK: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorEOS: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorBCH: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorETC: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorDASH: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorXMR: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorADA: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorCEX: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorDEFI: {
    prod: duplicateRateBlocks.one,
    test: null,
    exchanger: Exchanger.RatesBlockTwo,
  },
  AggregatorXAU_3: {
    prod: duplicateRateBlocks.two,
    test: null,
    exchanger: Exchanger.RatesBlockThree,
  },
  AggregatorXAG_3: {
    prod: duplicateRateBlocks.two,
    test: null,
    exchanger: Exchanger.RatesBlockThree,
  },
  AggregatorLINK_3: {
    prod: duplicateRateBlocks.three,
    test: null,
    exchanger: Exchanger.RatesBlockFour,
  },
  AggregatorBTC_3: {
    prod: duplicateRateBlocks.three,
    test: null,
    exchanger: Exchanger.RatesBlockFour,
  },
  AggregatorAUD_3: {
    prod: duplicateRateBlocks.three,
    test: null,
    exchanger: Exchanger.RatesBlockFour,
  },
  AggregatorEUR_3: {
    prod: duplicateRateBlocks.three,
    test: null,
    exchanger: Exchanger.RatesBlockFour,
  },
  AggregatorBCH_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorEOS_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorBNB_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorADA_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorREN_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorLEND_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorKNC_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorSNX_3: {
    prod: duplicateRateBlocks.four,
    test: null,
    exchanger: Exchanger.RatesBlockFive,
  },
  AggregatorDASH_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorETC_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorLTC_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorXMR_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorXRP_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorTRX_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorXTZ_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorCOMP_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorDEFI_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorCEX_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorETH_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorCHF_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorJPY_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorGBP_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorFTSE_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorNIKKEI_3: {
    prod: duplicateRateBlocks.five,
    test: null,
    exchanger: Exchanger.RatesBlockSix,
  },
  AggregatorOIL_3: {
    prod: 11198828,
    test: null,
    exchanger: Exchanger.RatesOIL_3,
  },
  AggregatorAAVE_3: {
    prod: 11179792,
    test: null,
    exchanger: Exchanger.RatesAAVE_3,
  },
  AggregatorDOT_3: {
    prod: 11322483,
    test: null,
    exchanger: Exchanger.RatesDOT_3,
  },
  AggregatorUNI_3: {
    prod: 11322507,
    test: null,
    exchanger: Exchanger.RatesUNI_3,
  },
  AggregatorFIL_3: {
    prod: 11322375,
    test: null,
    exchanger: Exchanger.RatesFIL_3,
  },
  AggregatorYFI_3: {
    prod: 11322433,
    test: null,
    exchanger: Exchanger.RatesYFI_3,
  },
};
