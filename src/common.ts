import { Bytes, ByteArray, BigInt } from '@graphprotocol/graph-ts';

import { Synthetix as SNX } from '../generated/Synthetix/Synthetix';

let sUSD4 = ByteArray.fromHexString('0x73555344') as Bytes;
let sUSD32 = ByteArray.fromHexString('0x7355534400000000000000000000000000000000000000000000000000000000') as Bytes;

export function attemptEffectiveValue(synthetix: SNX, currencyKey: Bytes, amount: BigInt, useBytes32: boolean): BigInt {
  let sUSD = sUSD4;
  if (useBytes32) {
    // Since v2.10 effectiveValue takes bytes32
    sUSD = sUSD32;
  }
  let effectiveValueTry = synthetix.try_effectiveValue(currencyKey, amount, sUSD);
  if (!effectiveValueTry.reverted) {
    return effectiveValueTry.value;
  }
  return null;
}
