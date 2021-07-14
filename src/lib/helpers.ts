import { BigDecimal, BigInt, Bytes, ByteArray, log } from '@graphprotocol/graph-ts';

import { LatestRate } from '../../generated/subgraphs/rates/schema';

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

export let FIFTEEN_MINUTE_SECONDS = BigInt.fromI32(900);
export let DAY_SECONDS = BigInt.fromI32(86400);

export function toDecimal(value: BigInt, decimals: u32 = 18): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

// Extrapolated from ByteArray.fromUTF8
export function strToBytes(string: string, length: i32 = 32): Bytes {
  let utf8 = string.toUTF8();
  let bytes = new ByteArray(length);
  let strLen = string.lengthUTF8 - 1;
  for (let i: i32 = 0; i < strLen; i++) {
    bytes[i] = load<u8>(utf8 + i);
  }
  return bytes as Bytes;
}

export let sUSD32 = strToBytes('sUSD', 32);

export function getTimeID(timestamp: BigInt, num: BigInt): BigInt {
  let remainder = timestamp.mod(num);
  return timestamp.minus(remainder);
}

export let etherUnits = new BigDecimal(BigInt.fromI32(10).pow(18));

export function getUSDAmountFromAssetAmount(amount: BigInt, rate: BigDecimal): BigDecimal {
  let decimalAmount = new BigDecimal(amount);
  let formattedDecimalAmount = decimalAmount.div(etherUnits);
  return formattedDecimalAmount.times(rate);
}

export function getLatestRate(synth: string, txHash: string): BigDecimal {
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    log.error('latest rate missing for synth: {}, in tx hash: {}', [synth, txHash]);
    return null;
  }
  return latestRate.rate;
}
