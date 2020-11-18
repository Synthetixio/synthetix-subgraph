import { Address, BigInt } from '@graphprotocol/graph-ts';

import { Synth, Transfer as SynthTransferEvent } from '../generated/SynthsUSD/Synth';

import { SynthHolder, SynthTransfer, SynthBalance } from '../generated/schema';

import { ZERO_ADDRESS } from './common';

// Synthetix v2.0.0 (rebrand from Havven and adding Multicurrency) at txn
// https://etherscan.io/tx/0x4b5864b1e4fdfe0ab9798de27aef460b124e9039a96d474ed62bd483e10c835a
let v200UpgradeBlock = BigInt.fromI32(6841188); // Dec 7, 2018

export function handleTransferSynth(event: SynthTransferEvent): void {
  let contract = Synth.bind(event.address);
  let entity = new SynthTransfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'sUSD';
  if (event.block.number > v200UpgradeBlock) {
    // sUSD contract didn't have the "currencyKey" field prior to the v2 (multicurrency) release
    let currencyKeyTry = contract.try_currencyKey();
    if (!currencyKeyTry.reverted) {
      entity.source = currencyKeyTry.value.toString();
    }
  }
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();

  if (event.params.from.toHex() != ZERO_ADDRESS) {
    trackSynthHolder(contract, entity.source, event.params.from);
  }
  if (event.params.to.toHex() != ZERO_ADDRESS) {
    trackSynthHolder(contract, entity.source, event.params.to);
  }
}

function trackSynthHolder(contract: Synth, source: string, account: Address): void {
  let synthHolderID = account.toHex();
  let synthHolder = SynthHolder.load(synthHolderID);
  if (synthHolder == null) {
    synthHolder = new SynthHolder(synthHolderID);
    synthHolder.save();
  }
  let synthBalance = SynthBalance.load(synthHolderID + '-' + source);
  synthBalance.synthHolder = synthHolderID;
  synthBalance.balanceOf = contract.balanceOf(account);
  synthBalance.synth = source;
  synthBalance.save();
}
