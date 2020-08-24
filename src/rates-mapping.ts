import { RatesUpdated as RatesUpdatedEvent } from '../generated/ExchangeRates_v223/ExchangeRates';
import { AnswerUpdated as AnswerUpdatedEvent } from '../generated/AggregatorAUD/Aggregator';
import { ExchangeRates } from '../generated/ExchangeRates/ExchangeRates';

import {
  RatesUpdated,
  RateUpdate,
  AggregatorAnswer,
  FifteenMinuteSNXPrice,
  DailySNXPrice,
  LatestRate,
} from '../generated/schema';

import { ByteArray, Bytes, BigInt, Address } from '@graphprotocol/graph-ts';

function loadDailySNXPrice(id: string): DailySNXPrice {
  let newDailySNXPrice = new DailySNXPrice(id);
  newDailySNXPrice.count = BigInt.fromI32(0);
  newDailySNXPrice.averagePrice = BigInt.fromI32(0);
  return newDailySNXPrice;
}

function loadFifteenMinuteSNXPrice(id: string): FifteenMinuteSNXPrice {
  let newFifteenMinuteSNXPrice = new FifteenMinuteSNXPrice(id);
  newFifteenMinuteSNXPrice.count = BigInt.fromI32(0);
  newFifteenMinuteSNXPrice.averagePrice = BigInt.fromI32(0);
  return newFifteenMinuteSNXPrice;
}

function calculateAveragePrice(oldAveragePrice: BigInt, newRate: BigInt, newCount: BigInt): BigInt {
  return oldAveragePrice
    .times(newCount.minus(BigInt.fromI32(1)))
    .plus(newRate)
    .div(newCount);
}

function handleSNXPrices(timestamp: BigInt, rate: BigInt): void {
  let dayID = timestamp.toI32() / 86400;
  let fifteenMinuteID = timestamp.toI32() / 900;

  let dailySNXPrice = DailySNXPrice.load(dayID.toString());
  let fifteenMinuteSNXPrice = FifteenMinuteSNXPrice.load(fifteenMinuteID.toString());

  if (dailySNXPrice == null) {
    dailySNXPrice = loadDailySNXPrice(dayID.toString());
  }

  if (fifteenMinuteSNXPrice == null) {
    fifteenMinuteSNXPrice = loadFifteenMinuteSNXPrice(fifteenMinuteID.toString());
  }

  dailySNXPrice.count = dailySNXPrice.count.plus(BigInt.fromI32(1));
  dailySNXPrice.averagePrice = calculateAveragePrice(dailySNXPrice.averagePrice, rate, dailySNXPrice.count);

  fifteenMinuteSNXPrice.count = fifteenMinuteSNXPrice.count.plus(BigInt.fromI32(1));
  fifteenMinuteSNXPrice.averagePrice = calculateAveragePrice(
    fifteenMinuteSNXPrice.averagePrice,
    rate,
    fifteenMinuteSNXPrice.count,
  );

  dailySNXPrice.save();
  fifteenMinuteSNXPrice.save();
}

function addLatestRate(synth: string, rate: BigInt) {
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    latestRate = new LatestRate(synth);
  }
  latestRate.rate = rate;
  latestRate.save();
}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  let dollarID = 'Synth sUSD';
  let dollarRate = LatestRate.load(dollarID);
  if (dollarRate == null) {
    dollarRate = new LatestRate(dollarID);
    dollarRate.rate = BigInt.fromI32(1000000000000000000 as i32);
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
    if (keys[i].toString() == 'SNX') {
      handleSNXPrices(event.block.timestamp, rateEntity.rate);
    }
    addLatestRate(rateEntity.synth, rateEntity.rate);
  }
}

// ---------------------
// Chainlink Aggregators
// ---------------------
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

let contractsToProxies = new Map<string, string>();
contractsToProxies.set(
  '0x05cf62c4ba0ccea3da680f9a8744ac51116d6231', // AUD
  '0x77F9710E7d0A19669A13c055F62cd80d313dF022',
);
contractsToProxies.set(
  '0x25fa978ea1a7dc9bdc33a2959b9053eae57169b5', // EUR
  '0xb49f677943BC038e9857d61E7d053CaA2C1734C1',
);
contractsToProxies.set(
  '0x02d5c618dbc591544b19d0bf13543c0728a3c4ec', // CHF
  '0x449d117117838fFA61263B61dA6301AA2a88B13A',
);
contractsToProxies.set(
  '0x151445852b0cfdf6a4cc81440f2af99176e8ad08', // GBP
  '0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5',
);
contractsToProxies.set(
  '0xe1407bfaa6b5965bad1c9f38316a3b655a09d8a6', // JPY
  '0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3',
);
contractsToProxies.set(
  '0x8946a183bfafa95becf57c5e08fe5b7654d2807b', // XAG
  '0x379589227b15F1a12195D3f2d90bBc9F31f95235',
);
contractsToProxies.set(
  '0xafce0c7b7fe3425adb3871eae5c0ec6d93e01935', // XAU
  '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6',
);
contractsToProxies.set(
  '0x16924ae9c2ac6cdbc9d6bb16fafcd38bed560936', // FTSE
  '0xE23FA0e8dd05D6f66a6e8c98cab2d9AE82A7550c',
);
contractsToProxies.set(
  '0x3f6e09a4ec3811765f5b2ad15c0279910dbb2c04', // NIKKEI225
  '0x5c4939a2ab3A2a9f93A518d81d4f8D0Bc6a68980',
);
contractsToProxies.set(
  '0xd3ce735cdc708d9607cfbc6c3429861625132cb4', // SNX
  '0xDC3EA94CD0AC27d9A86C180091e7f78C683d3699',
);
contractsToProxies.set(
  '0xf79d6afbb6da890132f9d7c355e3015f15f3406f', // ETH
  '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
);
contractsToProxies.set(
  '0x80eeb41e2a86d4ae9903a3860dd643dad2d1a853', // COMP
  '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
);
contractsToProxies.set(
  '0x45e9fee61185e213c37fc14d18e44ef9262e10db', // KNC
  '0xf8fF43E991A81e6eC886a3D281A2C6cC19aE70Fc',
);
contractsToProxies.set(
  '0x2408935efe60f092b442a8755f7572edb9cf971e', // LEND
  '0x4aB81192BB75474Cf203B56c36D6a13623270A67',
);
contractsToProxies.set(
  '0x353f61f39a17e56ca413f4559b8cd3b6a252ffc8', // REN
  '0x0f59666EDE214281e956cb3b2D0d69415AfF4A01',
);
contractsToProxies.set(
  '0xf5fff180082d6017036b771ba883025c654bc935', // BTC
  '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
);
contractsToProxies.set(
  '0x0821f21f21c325ae39557ca83b6b4df525495d06', // BNB
  '0x14e613AC84a31f709eadbdF89C6CC390fDc9540A',
);
contractsToProxies.set(
  '0x28e0fd8e05c14034cba95c6bf3394d1b106f7ed8', // TRX
  '0xacD0D1A29759CC01E8D925371B72cb2b5610EA25',
);
contractsToProxies.set(
  '0x52d674c76e91c50a0190de77da1fad67d859a569', // XTZ
  '0x5239a625dEb44bF3EeAc2CD5366ba24b8e9DB63F',
);
contractsToProxies.set(
  '0x570985649832b51786a181d57babe012be1c09a4', // XRP
  '0xCed2660c6Dd1Ffd856A5A82C67f3482d88C50b12',
);
contractsToProxies.set(
  '0xc6ee0d4943dc43bd462145aa6ac95e9c0c8b462f', // LTC
  '0x6AF09DF7563C363B5763b9102712EbeD3b9e859B',
);
contractsToProxies.set(
  '0x32dbd3214ac75223e27e575c53944307914f7a90', // LINK
  '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
);
contractsToProxies.set(
  '0x740be5e8fe30bd2bf664822154b520eae0c565b0', // EOS
  '0x10a43289895eAff840E8d45995BBa89f9115ECEe',
);
contractsToProxies.set(
  '0x6a6527d91ddae0a259cc09dad311b3455cdc1fbd', // BCH
  '0x9F0F69428F923D6c95B781F89E165C9b2df9789D',
);
contractsToProxies.set(
  '0xe2c9aea66ed352c33f9c7d8e824b7cac206b0b72', // ETC
  '0xaEA2808407B7319A31A383B6F8B60f04BCa23cE2',
);
contractsToProxies.set(
  '0xd9d35a82d4dd43be7cfc524ebf5cd00c92c48ebc', // DASH
  '0xFb0cADFEa136E9E343cfb55B863a6Df8348ab912',
);
contractsToProxies.set(
  '0xd1e850d6afb6c27a3d66a223f6566f0426a6e13b', // XMR
  '0xFA66458Cce7Dd15D8650015c4fce4D278271618F',
);
contractsToProxies.set(
  '0xf11bf075f0b2b8d8442ab99c44362f1353d40b44', // ADA
  '0xAE48c91dF1fE419994FFDa27da09D5aC69c30f55',
);
contractsToProxies.set(
  '0x46bb139f23b01fef37cb95ae56274804bc3b3e86', // CEX
  '0x283D433435cFCAbf00263beEF6A362b7cc5ed9f2',
);
contractsToProxies.set(
  '0x7ae7781c7f3a5182596d161e037e6db8e36328ef', // DEFI
  '0xa8E875F94138B0C5b51d1e1d5dE35bbDdd28EA87',
);

function createRates(event: AnswerUpdatedEvent, currencyKey: Bytes, rate: BigInt): void {
  let entity = new AggregatorAnswer(event.transaction.hash.toHex());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.currencyKey = currencyKey;
  entity.synth = currencyKey.toString();
  entity.rate = rate;
  entity.roundId = event.params.roundId;
  entity.aggregator = event.address;
  entity.save();

  addLatestRate(entity.synth, entity.rate);

  // save aggregated event as rate update from v2.17.5 (Procyon)
  if (event.block.number > BigInt.fromI32(9123410)) {
    let rateEntity = new RateUpdate(event.transaction.hash.toHex() + '-' + entity.synth);
    rateEntity.block = entity.block;
    rateEntity.timestamp = entity.timestamp;
    rateEntity.currencyKey = currencyKey;
    rateEntity.synth = entity.synth;
    rateEntity.rate = entity.rate;
    rateEntity.save();
    if (entity.currencyKey.toString() == 'SNX') {
      handleSNXPrices(entity.timestamp, entity.rate);
    }
  }
}

// create a contract mapping to know which synth the aggregator corresponds to
export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  // From Pollux on, use the ExchangeRates to get
  if (event.block.number > BigInt.fromI32(10773070)) {
    // Note: hard coding the latest ExchangeRates for now
    let exchangeRatesv227 = Address.fromHexString('0xbCc4ac49b8f57079df1029dD3146C8ECD805acd0');

    let exrates = ExchangeRates.bind(exchangeRatesv227 as Address);
    let currencyKeys = exrates.currenciesUsingAggregator(Address.fromHexString(
      contractsToProxies.get(event.address.toHexString()),
    ) as Address);

    // for each currency key using this aggregator
    for (let i = 0; i < currencyKeys.length; i++) {
      // create an answer entity
      createRates(event, currencyKeys[i], exrates.rateForCurrency(currencyKeys[i]));
    }
  } else {
    // for pre-pollux, use a contract mapping to get the currency key
    let currencyKey = contracts.get(event.address.toHexString());
    // and calculate the rate from Chainlink's Aggregator directly by multiplying by 1e10 to
    // turn the 8 decimal int to a 18 decimal one
    let rate = event.params.current.times(BigInt.fromI32(10).pow(10));
    createRates(event, ByteArray.fromHexString(currencyKey) as Bytes, rate);
  }
}
