const { createStartBlock } = require('../common');
const TestStartBlocks = require('./modify_start_blocks_for_testing');
const ProdStartBlocks = require('./modify_start_blocks_for_prod');

module.exports = {
  ExchangeRates_v231: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v231,
    testStartBlock: TestStartBlocks.ExchangeRates_v231,
  }),
  ExchangeRates_v240: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v240,
    testStartBlock: TestStartBlocks.ExchangeRates_v240,
  }),
  ExchangeRates_v272: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v272,
    testStartBlock: TestStartBlocks.ExchangeRates_v272,
  }),
  ExchangeRates_v210: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v210,
    testStartBlock: TestStartBlocks.ExchangeRates_v210,
  }),
  ExchangeRates_v213: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v213,
    testStartBlock: TestStartBlocks.ExchangeRates_v213,
  }),
  ExchangeRates_v217: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v217,
    testStartBlock: TestStartBlocks.ExchangeRates_v217,
  }),
  ExchangeRates_v219: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v219,
    testStartBlock: TestStartBlocks.ExchangeRates_v219,
  }),
  ExchangeRates_v223: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates_v223,
    testStartBlock: TestStartBlocks.ExchangeRates_v223,
  }),
  ExchangeRates: createStartBlock({
    prodStartBlock: ProdStartBlocks.ExchangeRates,
    testStartBlock: TestStartBlocks.ExchangeRates,
  }),
  AggregatorAUD: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorAUD,
    testStartBlock: TestStartBlocks.AggregatorAUD,
  }),
  AggregatorEUR: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorEUR,
    testStartBlock: TestStartBlocks.AggregatorEUR,
  }),
  AggregatorCHF: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorCHF,
    testStartBlock: TestStartBlocks.AggregatorCHF,
  }),
  AggregatorGBP: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorGBP,
    testStartBlock: TestStartBlocks.AggregatorGBP,
  }),
  AggregatorJPY: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorJPY,
    testStartBlock: TestStartBlocks.AggregatorJPY,
  }),
  AggregatorXAG: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXAG,
    testStartBlock: TestStartBlocks.AggregatorXAG,
  }),
  AggregatorXAU: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXAU,
    testStartBlock: TestStartBlocks.AggregatorXAU,
  }),
  AggregatorFTSE: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorFTSE,
    testStartBlock: TestStartBlocks.AggregatorFTSE,
  }),
  AggregatorN225: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorN225,
    testStartBlock: TestStartBlocks.AggregatorN225,
  }),
  AggregatorSNX: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorSNX,
    testStartBlock: TestStartBlocks.AggregatorSNX,
  }),
  AggregatorETH: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorETH,
    testStartBlock: TestStartBlocks.AggregatorETH,
  }),
  AggregatorCOMP: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorCOMP,
    testStartBlock: TestStartBlocks.AggregatorCOMP,
  }),
  AggregatorKNC: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorKNC,
    testStartBlock: TestStartBlocks.AggregatorKNC,
  }),
  AggregatorLEND: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorLEND,
    testStartBlock: TestStartBlocks.AggregatorLEND,
  }),
  AggregatorREN: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorREN,
    testStartBlock: TestStartBlocks.AggregatorREN,
  }),
  AggregatorBTC: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorBTC,
    testStartBlock: TestStartBlocks.AggregatorBTC,
  }),
  AggregatorBNB: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorBNB,
    testStartBlock: TestStartBlocks.AggregatorBNB,
  }),
  AggregatorTRX: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorTRX,
    testStartBlock: TestStartBlocks.AggregatorTRX,
  }),
  AggregatorXTZ: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXTZ,
    testStartBlock: TestStartBlocks.AggregatorXTZ,
  }),
  AggregatorXRP: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXRP,
    testStartBlock: TestStartBlocks.AggregatorXRP,
  }),
  AggregatorLTC: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorLTC,
    testStartBlock: TestStartBlocks.AggregatorLTC,
  }),
  AggregatorLINK: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorLINK,
    testStartBlock: TestStartBlocks.AggregatorLINK,
  }),
  AggregatorEOS: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorEOS,
    testStartBlock: TestStartBlocks.AggregatorEOS,
  }),
  AggregatorBCH: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorBCH,
    testStartBlock: TestStartBlocks.AggregatorBCH,
  }),
  AggregatorETC: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorETC,
    testStartBlock: TestStartBlocks.AggregatorETC,
  }),
  AggregatorDASH: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorDASH,
    testStartBlock: TestStartBlocks.AggregatorDASH,
  }),
  AggregatorXMR: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXMR,
    testStartBlock: TestStartBlocks.AggregatorXMR,
  }),
  AggregatorADA: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorADA,
    testStartBlock: TestStartBlocks.AggregatorADA,
  }),
  AggregatorCEX: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorCEX,
    testStartBlock: TestStartBlocks.AggregatorCEX,
  }),
  AggregatorDEFI: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorDEFI,
    testStartBlock: TestStartBlocks.AggregatorDEFI,
  }),
  AggregatorXAU_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXAU_3,
    testStartBlock: TestStartBlocks.AggregatorXAU_3,
  }),
  AggregatorXAG_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXAG_3,
    testStartBlock: TestStartBlocks.AggregatorXAG_3,
  }),
  AggregatorLINK_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorLINK_3,
    testStartBlock: TestStartBlocks.AggregatorLINK_3,
  }),
  AggregatorBTC_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorBTC_3,
    testStartBlock: TestStartBlocks.AggregatorBTC_3,
  }),
  AggregatorAUD_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorAUD_3,
    testStartBlock: TestStartBlocks.AggregatorAUD_3,
  }),
  AggregatorEUR_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorEUR_3,
    testStartBlock: TestStartBlocks.AggregatorEUR_3,
  }),
  AggregatorBCH_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorBCH_3,
    testStartBlock: TestStartBlocks.AggregatorBCH_3,
  }),
  AggregatorEOS_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorEOS_3,
    testStartBlock: TestStartBlocks.AggregatorEOS_3,
  }),
  AggregatorBNB_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorBNB_3,
    testStartBlock: TestStartBlocks.AggregatorBNB_3,
  }),
  AggregatorADA_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorADA_3,
    testStartBlock: TestStartBlocks.AggregatorADA_3,
  }),
  AggregatorREN_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorREN_3,
    testStartBlock: TestStartBlocks.AggregatorREN_3,
  }),
  AggregatorLEND_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorLEND_3,
    testStartBlock: TestStartBlocks.AggregatorLEND_3,
  }),
  AggregatorKNC_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorKNC_3,
    testStartBlock: TestStartBlocks.AggregatorKNC_3,
  }),
  AggregatorSNX_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorSNX_3,
    testStartBlock: TestStartBlocks.AggregatorSNX_3,
  }),
  AggregatorDASH_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorDASH_3,
    testStartBlock: TestStartBlocks.AggregatorDASH_3,
  }),
  AggregatorETC_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorETC_3,
    testStartBlock: TestStartBlocks.AggregatorETC_3,
  }),
  AggregatorLTC_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorLTC_3,
    testStartBlock: TestStartBlocks.AggregatorLTC_3,
  }),
  AggregatorXMR_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXMR_3,
    testStartBlock: TestStartBlocks.AggregatorXMR_3,
  }),
  AggregatorXRP_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXRP_3,
    testStartBlock: TestStartBlocks.AggregatorXRP_3,
  }),
  AggregatorTRX_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorTRX_3,
    testStartBlock: TestStartBlocks.AggregatorTRX_3,
  }),
  AggregatorXTZ_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorXTZ_3,
    testStartBlock: TestStartBlocks.AggregatorXTZ_3,
  }),
  AggregatorCOMP_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorCOMP_3,
    testStartBlock: TestStartBlocks.AggregatorCOMP_3,
  }),
  AggregatorDEFI_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorDEFI_3,
    testStartBlock: TestStartBlocks.AggregatorDEFI_3,
  }),
  AggregatorCEX_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorCEX_3,
    testStartBlock: TestStartBlocks.AggregatorCEX_3,
  }),
  AggregatorETH_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorETH_3,
    testStartBlock: TestStartBlocks.AggregatorETH_3,
  }),
  AggregatorCHF_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorCHF_3,
    testStartBlock: TestStartBlocks.AggregatorCHF_3,
  }),
  AggregatorJPY_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorJPY_3,
    testStartBlock: TestStartBlocks.AggregatorJPY_3,
  }),
  AggregatorGBP_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorGBP_3,
    testStartBlock: TestStartBlocks.AggregatorGBP_3,
  }),
  AggregatorFTSE_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorFTSE_3,
    testStartBlock: TestStartBlocks.AggregatorFTSE_3,
  }),
  AggregatorNIKKEI_3: createStartBlock({
    prodStartBlock: ProdStartBlocks.AggregatorNIKKEI_3,
    testStartBlock: TestStartBlocks.AggregatorNIKKEI_3,
  }),
};
