/**
 * Use this file to update the prod start blocks for the rates subgraph
 * you can also set them all to a single block using the
 * UNIVERSAL_START_BLOCK environment variable in package json
 * NOTE: if you change the test blocks you have to run `npm run codegen:exchanger:test` command
 * or else it will use the prod settings
 * */

module.exports = {
  Exchanger: null,
  Exchanger_v2: null,
  Exchanger_v3: null,
  Synthetix: null,
  RatesBlockOne: null,
  RatesBlockTwo: null,
  RatesBlockThree: null,
  RatesBlockFour: null,
  RatesBlockFive: null,
  RatesBlockSix: null,
};
