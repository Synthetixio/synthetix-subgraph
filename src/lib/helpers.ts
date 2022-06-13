import { BigDecimal, BigInt, Bytes, Address } from '@graphprotocol/graph-ts';

import { LatestRate } from '../../generated/subgraphs/latest-rates/schema';
import { initFeed } from '../fragments/latest-rates';

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

export let ZERO_ADDRESS = changetype<Address>(Address.fromHexString('0x0000000000000000000000000000000000000000'));
export let FEE_ADDRESS = changetype<Address>(Address.fromHexString('0xfeefeefeefeefeefeefeefeefeefeefeefeefeef'));

export let ONE_MINUTE_SECONDS = BigInt.fromI32(60);
export let FIFTEEN_MINUTE_SECONDS = BigInt.fromI32(900);
export let DAY_SECONDS = BigInt.fromI32(86400);
export let YEAR_SECONDS = BigInt.fromI32(31556736);

export let CANDLE_PERIODS: BigInt[] = [
  DAY_SECONDS.times(BigInt.fromI32(30)),
  DAY_SECONDS.times(BigInt.fromI32(7)),
  DAY_SECONDS.times(BigInt.fromI32(3)),
  DAY_SECONDS,
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(720)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(480)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(240)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(120)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(60)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(30)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(15)),
  ONE_MINUTE_SECONDS.times(BigInt.fromI32(5)),
  ONE_MINUTE_SECONDS,
];

export function toDecimal(value: BigInt, decimals: u32 = 18): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function strToBytes(str: string, length: i32 = 32): Bytes {
  return Bytes.fromByteArray(Bytes.fromUTF8(str));
}

export let sUSD32 = strToBytes('sUSD', 32);
export let sUSD4 = strToBytes('sUSD', 4);

export function getTimeID(timestamp: BigInt, num: BigInt): BigInt {
  let remainder = timestamp.mod(num);
  return timestamp.minus(remainder);
}

export function getUSDAmountFromAssetAmount(amount: BigInt, rate: BigDecimal): BigDecimal {
  let decimalAmount = toDecimal(amount);
  return decimalAmount.times(rate);
}

export function getLatestRate(synth: string, txHash: string): BigDecimal | null {
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    // load feed for the first time, and use contract call to get rate
    return initFeed(synth);
  }
  return latestRate.rate;
}
