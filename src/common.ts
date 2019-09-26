import { Bytes, ByteArray, BigInt } from '@graphprotocol/graph-ts';

import { Synthetix as SNX } from '../generated/Synthetix/Synthetix';

let sUSD4 = ByteArray.fromHexString('0x73555344') as Bytes;
let sUSD32 = ByteArray.fromHexString('0x7355534400000000000000000000000000000000000000000000000000000000') as Bytes;

export function attemptEffectiveValue(synthetix: SNX, currencyKey: Bytes, amount: BigInt): BigInt {
  // Since v2.10 effectiveValue takes bytes32
  let effectiveValueTry = synthetix.try_effectiveValue(currencyKey, amount, sUSD32);
  if (effectiveValueTry.reverted) {
    // Yet earlier it was bytes4
    effectiveValueTry = synthetix.try_effectiveValue(currencyKey, amount, sUSD4);
  }
  if (!effectiveValueTry.reverted) {
    return effectiveValueTry.value;
  }
  return null;
}
