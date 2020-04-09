import { Bytes, ByteArray } from '@graphprotocol/graph-ts';

// import { Synthetix32 as SNX } from '../generated/Synthetix/Synthetix32';

// Extrapolated from ByteArray.fromUTF8
export function strToBytes(string: string, len: i32 = 32): Bytes {
  let utf8 = string.toUTF8();
  let bytes = new ByteArray(len);
  for (let i: i32 = 0; i < len; i++) {
    bytes[i] = load<u8>(utf8 + i);
  }
  return bytes as Bytes;
}

export let sUSD32 = strToBytes('sUSD', 32);
export let sUSD4 = strToBytes('sUSD', 4);

// No longer used
// export function attemptEffectiveValue(synthetix: SNX, currencyKey: Bytes, amount: BigInt, useBytes32: boolean): BigInt {
//   let sUSD = sUSD4;
//   if (useBytes32) {
//     // Since v2.10 effectiveValue takes bytes32
//     sUSD = sUSD32;
//   }

//   // Note: since v2.19.x the below no longer works
//   let effectiveValueTry = synthetix.try_effectiveValue(currencyKey, amount, sUSD);
//   if (!effectiveValueTry.reverted) {
//     return effectiveValueTry.value;
//   }
//   return null;
// }
