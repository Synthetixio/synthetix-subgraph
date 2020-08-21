import { RatesUpdated as RatesUpdatedEvent } from '../generated/ExchangeRates/ExchangeRates';
import { AnswerUpdated as AnswerUpdatedEvent } from '../generated/AggregatorAUD/Aggregator';

import { RatesUpdated, RateUpdate, AggregatorAnswer, LatestRate } from '../generated/schema';

import { ByteArray, Bytes, BigInt } from '@graphprotocol/graph-ts';

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  let dollarID = 'Synth sUSD';
  let dollarRate = LatestRate.load(dollarID);
  if (dollarRate == null) {
    dollarRate = new LatestRate(dollarID);
    dollarRate.rate = BigInt.fromI32(1);
    dollarRate.save();
  }
  let entity = new RatesUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.currencyKeys = event.params.currencyKeys;
  entity.newRates = event.params.newRates;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.from = event.transaction.from;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();

  // required due to assemblyscript
  let keys = entity.currencyKeys;
  let rates = entity.newRates;
  // now save each individual update
  for (let i = 0; i < entity.currencyKeys.length; i++) {
    let rateEntity = new RateUpdate(event.transaction.hash.toHex() + '-' + keys[i].toString());
    rateEntity.block = event.block.number;
    rateEntity.timestamp = event.block.timestamp;
    rateEntity.currencyKey = keys[i];
    rateEntity.synth = keys[i].toString();
    rateEntity.rate = rates[i];
    rateEntity.save();
    addLatestRate(rateEntity.synth, rateEntity.rate);
  }
}

// ---------------------
// Chainlink Aggregators
// ---------------------

// create a contract mapping to know which synth the aggregator corresponds to
let contracts = new Map<string, string>();
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

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let entity = new AggregatorAnswer(event.transaction.hash.toHex());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  let currencyKey = contracts.get(event.address.toHexString());
  entity.currencyKey = ByteArray.fromHexString(currencyKey) as Bytes;
  entity.synth = entity.currencyKey.toString();
  // now multiply by 1e10 to turn the 8 decimal int to a 18 decimal one
  entity.rate = event.params.current.times(BigInt.fromI32(10).pow(10));
  entity.roundId = event.params.roundId;
  entity.aggregator = event.address;
  entity.save();

  // save aggregated event as rate update from v2.17.5 (Procyon)
  if (event.block.number > BigInt.fromI32(9123410)) {
    let rateEntity = new RateUpdate(event.transaction.hash.toHex() + '-' + entity.synth);
    rateEntity.block = entity.block;
    rateEntity.timestamp = entity.timestamp;
    rateEntity.currencyKey = entity.currencyKey;
    rateEntity.synth = entity.synth;
    rateEntity.rate = entity.rate;
    rateEntity.save();
    addLatestRate(entity.synth, entity.rate);
  }
}

function addLatestRate(synth: string, rate: BigInt): void {
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    latestRate = new LatestRate(synth);
  }
  latestRate.rate = rate;
  latestRate.save();
}
