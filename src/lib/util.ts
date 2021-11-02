import { BigDecimal, BigInt, Bytes, ByteArray, Address } from '@graphprotocol/graph-ts';
import { contracts } from '../../generated/contracts';

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

export let ZERO_ADDRESS = Address.fromHexString('0x0000000000000000000000000000000000000000') as Address;

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
export let sUSD4 = strToBytes('sUSD', 4);
export let etherUnits = new BigDecimal(BigInt.fromI32(10).pow(18));

export function isEscrow(holder: string, network: string): boolean {
  if (network == 'mainnet') {
    return contracts.get('escrow-mainnet') == holder || contracts.get('rewardEscrow-mainnet') == holder;
  } else if (network == 'kovan') {
    return contracts.get('escrow-kovan') == holder || contracts.get('rewardEscrow-kovan') == holder;
  } else if (network == 'optimism') {
    return contracts.get('escrow-optimism') == holder || contracts.get('rewardEscrow-optimism') == holder;
  } else if (network == 'optimism-kovan') {
    return contracts.get('escrow-optimism-kovan') == holder || contracts.get('rewardEscrow-optimism-kovan') == holder;
  }
  return false;
}
