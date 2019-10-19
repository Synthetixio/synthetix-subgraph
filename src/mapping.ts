import {
  Synthetix as SNX,
  Transfer as TransferEvent,
  IssueSynthsCall,
  BurnSynthsCall,
} from '../generated/Synthetix/Synthetix';
import { TargetUpdated as TargetUpdatedEvent } from '../generated/ProxySynthetix/Proxy';
import { Vested as VestedEvent, RewardEscrow } from '../generated/RewardEscrow/RewardEscrow';
import {
  Synth,
  Transfer as SynthTransferEvent,
  Issued as IssuedEvent,
  Burned as BurnedEvent,
} from '../generated/SynthsUSD/Synth';
import {
  Synthetix,
  Transfer,
  Issued,
  Burned,
  Issuer,
  ProxyTargetUpdated,
  SNXHolder,
  RewardEscrowHolder,
} from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

let contracts = new Map<string, string>();
contracts.set('escrow', '0x971e78e0c92392a4e39099835cf7e6ab535b2227');
contracts.set('rewardEscrow', '0xb671f2210b1f6621a2607ea63e6b2dc3e2464d1f');

// Synthetix upgrade from Havven at txn: https://etherscan.io/tx/0x4a19db6cd8f01226bfe74a1a194f971e5d19568b019a45efd0dfbcaf9a901b02
// Block #: 6840246
let v2UpgradeBlock = BigInt.fromI32(6840246);

function getMetadata(): Synthetix {
  let synthetix = Synthetix.load('1');

  if (synthetix == null) {
    synthetix = new Synthetix('1');
    synthetix.issuers = BigInt.fromI32(0);
    synthetix.snxHolders = BigInt.fromI32(0);
    synthetix.save();
  }

  return synthetix as Synthetix;
}

function incrementMetadata(field: string): void {
  let metadata = getMetadata();
  if (field == 'issuers') {
    metadata.issuers = metadata.issuers.plus(BigInt.fromI32(1));
  } else if (field == 'snxHolders') {
    metadata.snxHolders = metadata.snxHolders.plus(BigInt.fromI32(1));
  }
  metadata.save();
}

function trackIssuer(account: Address): void {
  let existingIssuer = Issuer.load(account.toHex());
  if (existingIssuer == null) {
    incrementMetadata('issuers');
  }
  let issuer = new Issuer(account.toHex());

  // let synthetix = SNX.bind(snxContract);

  // TODO: commented out for bytes32 upgrade (needs to use same technique as effectiveValue)
  // let synthetixDebtBalanceOfTry = synthetix.try_debtBalanceOf(account, sUSD);
  // if (!synthetixDebtBalanceOfTry.reverted) {
  //   issuer.debtBalance = synthetixDebtBalanceOfTry.value; // sUSD
  // }
  // let synthetixCRatioTry = synthetix.try_collateralisationRatio(account);
  // if (!synthetixCRatioTry.reverted) {
  //   issuer.collateralisationRatio = synthetixCRatioTry.value;
  // }
  issuer.save();
}

function trackSNXHolder(snxContract: Address, account: Address, block: BigInt): void {
  let holder = account.toHex();
  // ignore escrow accounts
  if (contracts.get('escrow') == holder || contracts.get('rewardEscrow') == holder) {
    return;
  }
  let existingSNXHolder = SNXHolder.load(account.toHex());
  if (existingSNXHolder == null) {
    incrementMetadata('snxHolders');
  }
  let snxHolder = new SNXHolder(account.toHex());
  let synthetix = SNX.bind(snxContract);

  // Don't bother trying collateral before v2 upgrade (slows down processing A LOT)
  if (block > v2UpgradeBlock) {
    let synthetixCollateralTry = synthetix.try_collateral(account);
    if (!synthetixCollateralTry.reverted) {
      snxHolder.collateral = synthetixCollateralTry.value;
    }
  }
  snxHolder.save();
}

export function handleTransferSNX(event: TransferEvent): void {
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'SNX';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();

  trackSNXHolder(event.address, event.params.from, event.block.number);
  trackSNXHolder(event.address, event.params.to, event.block.number);
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  let contract = Synth.bind(event.address);
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'sUSD';
  if (event.block.number > v2UpgradeBlock) {
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
}

export function handleProxyTargetUpdated(event: TargetUpdatedEvent): void {
  let entity = new ProxyTargetUpdated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'Synthetix'; // hardcoded for now
  entity.newTarget = event.params.newTarget;
  entity.block = event.block.number;
  entity.tx = event.transaction.hash;
  entity.save();
}

// Note: we use VestedEvent here even though is also handles VestingEntryCreated (they share the same signature)
export function handleRewardVestEvent(event: VestedEvent): void {
  let entity = new RewardEscrowHolder(event.params.beneficiary.toHex());
  let contract = RewardEscrow.bind(event.address);
  entity.balanceOf = contract.balanceOf(event.params.beneficiary);
  entity.save();
  // now track the SNX holder as this action can impact their collateral
  let synthetixAddress = contract.synthetix();
  trackSNXHolder(synthetixAddress, event.params.beneficiary, event.block.number);
}

export function handleIssueSynths(call: IssueSynthsCall): void {
  let entity = new Issued(call.transaction.hash.toHex());
  entity.account = call.transaction.from;

  entity.value = call.inputs.amount;
  entity.source = call.inputs.currencyKey.toString();
  entity.timestamp = call.block.timestamp;
  entity.block = call.block.number;
  entity.gasPrice = call.transaction.gasPrice;
  entity.save();
  trackIssuer(call.transaction.from);
}

export function handleBurnSynths(call: BurnSynthsCall): void {
  let entity = new Burned(call.transaction.hash.toHex());
  entity.account = call.transaction.from;

  entity.value = call.inputs.amount;
  entity.source = call.inputs.currencyKey.toString();
  entity.timestamp = call.block.timestamp;
  entity.block = call.block.number;
  entity.gasPrice = call.transaction.gasPrice;
  entity.save();
}
