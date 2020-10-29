const { createStartBlock } = require('../common');
const TestStartBlocks = require('./modify_start_blocks_for_testing');
const ProdStartBlocks = require('./modify_start_blocks_for_prod');

module.exports = {
  Exchanger: createStartBlock({
    prodStartBlock: ProdStartBlocks.Exchanger,
    testStartBlock: TestStartBlocks.Exchanger,
  }),
  Exchanger_v2: createStartBlock({
    prodStartBlock: ProdStartBlocks.Exchanger_v2,
    testStartBlock: TestStartBlocks.Exchanger_v2,
  }),
  Exchanger_v3: createStartBlock({
    prodStartBlock: ProdStartBlocks.Exchanger_v3,
    testStartBlock: TestStartBlocks.Exchanger_v3,
  }),
  Synthetix: createStartBlock({
    prodStartBlock: ProdStartBlocks.Synthetix,
    testStartBlock: TestStartBlocks.Synthetix,
  }),
  RatesBlockOne: createStartBlock({
    prodStartBlock: ProdStartBlocks.RatesBlockOne,
    testStartBlock: TestStartBlocks.RatesBlockOne,
  }),
  RatesBlockTwo: createStartBlock({
    prodStartBlock: ProdStartBlocks.RatesBlockTwo,
    testStartBlock: TestStartBlocks.RatesBlockTwo,
  }),
  RatesBlockThree: createStartBlock({
    prodStartBlock: ProdStartBlocks.RatesBlockThree,
    testStartBlock: TestStartBlocks.RatesBlockThree,
  }),
  RatesBlockFour: createStartBlock({
    prodStartBlock: ProdStartBlocks.RatesBlockFour,
    testStartBlock: TestStartBlocks.RatesBlockFour,
  }),
  RatesBlockFive: createStartBlock({
    prodStartBlock: ProdStartBlocks.RatesBlockFive,
    testStartBlock: TestStartBlocks.RatesBlockFive,
  }),
  RatesBlockSix: createStartBlock({
    prodStartBlock: ProdStartBlocks.RatesBlockSix,
    testStartBlock: TestStartBlocks.RatesBlockSix,
  }),
};
