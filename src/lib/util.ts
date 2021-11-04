import { BigDecimal, BigInt, Bytes, ByteArray, Address } from '@graphprotocol/graph-ts';
import { contracts } from '../../generated/contracts';

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
