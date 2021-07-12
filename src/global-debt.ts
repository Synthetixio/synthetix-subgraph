// The latest Synthetix and event invocations

import { AddressResolver } from '../generated/subgraphs/global-debt/ProxyERC20_0/AddressResolver';
import { Synthetix as SNX } from '../generated/subgraphs/global-debt/ProxyERC20_0/Synthetix';
import { SynthetixState } from '../generated/subgraphs/global-debt/ProxyERC20_0/SynthetixState';

import { strToBytes, toDecimal } from './lib/util';

// SynthetixState has not changed ABI since deployment

import { DebtState } from '../generated/subgraphs/global-debt/schema';

import { BigInt, Address, ethereum } from '@graphprotocol/graph-ts';

export function trackGlobalDebt(block: ethereum.Block): void {
  let timeSlot = block.timestamp.minus(block.timestamp.mod(BigInt.fromI32(900)));

  let curDebtState = DebtState.load(timeSlot.toString());

  if (curDebtState == null) {
    // this is tmp because this will be refactored soon anyway
    let resolver = AddressResolver.bind(Address.fromHexString('0x4e3b31eb0e5cb73641ee1e65e7dcefe520ba3ef2') as Address);

    let synthetixStateAddress = resolver.try_getAddress(strToBytes('SynthetixState', 32));

    if (synthetixStateAddress.reverted) {
      return;
    }

    let synthetixState = SynthetixState.bind(synthetixStateAddress.value);

    let synthetix = SNX.bind(Address.fromHexString('0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f') as Address);
    let issuedSynths = synthetix.try_totalIssuedSynthsExcludeEtherCollateral(strToBytes('sUSD', 32));

    if (issuedSynths.reverted) {
      issuedSynths = synthetix.try_totalIssuedSynths(strToBytes('sUSD', 32));
    }

    let debtStateEntity = new DebtState(timeSlot.toString());

    debtStateEntity.timestamp = block.timestamp;
    debtStateEntity.debtEntry = toDecimal(synthetixState.lastDebtLedgerEntry());
    debtStateEntity.totalIssuedSynths = toDecimal(issuedSynths.value);

    debtStateEntity.debtRatio = debtStateEntity.totalIssuedSynths.div(debtStateEntity.debtEntry);
    debtStateEntity.save();
  }
}

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(BigInt.fromI32(25)).equals(BigInt.fromI32(0))) {
    trackGlobalDebt(block);
  }
}
