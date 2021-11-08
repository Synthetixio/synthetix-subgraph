import { BigDecimal, BigInt, Bytes, Address, log } from '@graphprotocol/graph-ts';

import { contracts } from '../../generated/contracts';
import { LatestRate } from '../../generated/subgraphs/latest-rates/schema';
import { initFeed } from '../fragments/latest-rates';

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

export let ZERO_ADDRESS = changetype<Address>(Address.fromHexString('0x0000000000000000000000000000000000000000'));
export let FEE_ADDRESS = changetype<Address>(Address.fromHexString('0xfeefeefeefeefeefeefeefeefeefeefeefeefeef'));

export let FIFTEEN_MINUTE_SECONDS = BigInt.fromI32(900);
export let DAY_SECONDS = BigInt.fromI32(86400);
export let YEAR_SECONDS = BigInt.fromI32(31556736);

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
    log.warning('latest rate missing for synth: {}, in tx hash: {}', [synth, txHash]);

    // load feed for the first time, and use contract call to get rate
    return initFeed(synth);
  }
  return latestRate.rate;
}

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
