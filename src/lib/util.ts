import { escrowContracts } from './escrow-contracts';

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
