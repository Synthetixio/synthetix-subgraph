import { Synthetix as SNX, Transfer as TransferEvent } from '../generated/Synthetix/Synthetix';
import { TargetUpdated as TargetUpdatedEvent } from '../generated/ProxySynthetix/Proxy';

import {
  Synth,
  Transfer as SynthTransferEvent,
  Issued as IssuedEvent,
  Burned as BurnedEvent,
} from '../generated/SynthsUSD/Synth';
import { Synthetix, Transfer, Issued, Burned, Issuer, ProxyTargetUpdated, SNXHolder } from '../generated/schema';

import { BigInt, Address } from '@graphprotocol/graph-ts';

let contracts = new Map<string, string>();
contracts.set('escrow', '0x971e78e0c92392a4e39099835cf7e6ab535b2227');
contracts.set('rewardEscrow', '0xb671f2210b1f6621a2607ea63e6b2dc3e2464d1f');

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

function trackIssuer(snxContract: Address, account: Address): void {
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

function trackSNXHolder(snxContract: Address, account: Address): void {
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
  let synthetixCollateralTry = synthetix.try_collateral(account);
  if (!synthetixCollateralTry.reverted) {
    snxHolder.collateral = synthetixCollateralTry.value;
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

  trackSNXHolder(event.address, event.params.from);
  trackSNXHolder(event.address, event.params.to);
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  let contract = Synth.bind(event.address);
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  let currencyKeyTry = contract.try_currencyKey();
  if (!currencyKeyTry.reverted) {
    entity.source = currencyKeyTry.value.toString();
  } else {
    // sUSD contract didn't have the "currencyKey" field prior to the v2 (multicurrency) release
    entity.source = 'sUSD';
  }
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();
}

export function handleIssuedsUSD(event: IssuedEvent): void {
  let entity = new Issued(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.value = event.params.value;
  entity.source = 'sUSD';
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  entity.save();

  let synthContract = Synth.bind(event.address);
  // only track issuers after "synthetix" added to the synth (v2 - prior to that it was "havven")
  let synthetixTry = synthContract.try_synthetix();
  if (!synthetixTry.reverted) {
    trackIssuer(synthetixTry.value, event.transaction.from);
  }
}

export function handleBurnedsUSD(event: BurnedEvent): void {
  let entity = new Burned(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.account = event.params.account;
  entity.value = event.params.value;
  entity.source = 'sUSD';
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
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
