import { BigDecimal, BigInt, Bytes, ByteArray, Address } from '@graphprotocol/graph-ts';
import { escrowContracts } from './escrow-contracts';

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

export function getTimeID(timestampI32: i32, num: i32): string {
  let id = timestampI32 / num;
  return id.toString();
}

export function isEscrow(holder: string, network: string): boolean {
  if (network == 'mainnet') {
    return escrowContracts.get('escrow-mainnet') == holder || escrowContracts.get('rewardEscrow-mainnet') == holder;
  } else if (network == 'kovan') {
    return escrowContracts.get('escrow-kovan') == holder || escrowContracts.get('rewardEscrow-kovan') == holder;
  } else if (network == 'optimism') {
    return escrowContracts.get('escrow-optimism') == holder || escrowContracts.get('rewardEscrow-optimism') == holder;
  } else if (network == 'optimism-kovan') {
    return (
      escrowContracts.get('escrow-optimism-kovan') == holder ||
      escrowContracts.get('rewardEscrow-optimism-kovan') == holder
    );
  }
  return false;
}
