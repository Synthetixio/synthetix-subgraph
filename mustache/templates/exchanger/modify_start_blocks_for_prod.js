/**
 * Use this file to update the prod start blocks for the exchanger subgraph
 * RatesBlockOne to RatesBlockSix represent groupings for the various rates contracts used
 * in the exchanger subgraph. The main difference between the rates subgraph start
 * blocks and the exchanger subgraph rates start blocks is that we do not need rates for the
 * exchanger subgraph prior to RatesBlockOne - 10537958 for the exchanger subgraph, so we group
 * all of those into a single block
 * */

module.exports = {
  Exchanger: 10557958,
  Exchanger_v2: 10772592,
  Exchanger_v3: 11012438,
  Synthetix: 10782000,
  RatesBlockOne: 10537958,
  RatesBlockTwo: 10773070,
  RatesBlockThree: 10873070,
  RatesBlockFour: 10921231,
  RatesBlockFive: 10950006,
  RatesBlockSix: 10960006,
};
