// The latest Synthetix and event invocations
import {
  Synthetix as SNX,
  Transfer as SNXTransferEvent,
  IssueSynthsCall,
  IssueMaxSynthsCall,
  BurnSynthsCall,
} from '../generated/Synthetix/Synthetix';

import { AddressResolver } from '../generated/Synthetix/AddressResolver';

import { Synthetix32 } from '../generated/Synthetix/Synthetix32';

// Synthetix_bytes32 ABI and event invocations
import {
  IssueSynthsCall as IssueSynthsCall32,
  IssueMaxSynthsCall as IssueMaxSynthsCall32,
  BurnSynthsCall as BurnSynthsCall32,
} from '../generated/Synthetix32/Synthetix32';

import { Synthetix4 } from '../generated/Synthetix4/Synthetix4';

// SynthetixState has not changed ABI since deployment
import { SynthetixState } from '../generated/Synthetix/SynthetixState';

import { TargetUpdated as TargetUpdatedEvent } from '../generated/ProxySynthetix/Proxy';
import { Vested as VestedEvent, RewardEscrow } from '../generated/RewardEscrow/RewardEscrow';
import { Synth, Transfer as SynthTransferEvent } from '../generated/SynthsUSD/Synth';
import { FeesClaimed as FeesClaimedEvent } from '../generated/FeePool/FeePool';

import {
  Synthetix,
  Transfer,
  Issued,
  Burned,
  Issuer,
  ContractUpdated,
  SNXHolder,
  RewardEscrowHolder,
  FeesClaimed,
} from '../generated/schema';

import { BigInt, Address, ethereum, Bytes, ByteArray } from '@graphprotocol/graph-ts';

let contracts = new Map<string, string>();
contracts.set('escrow', '0x971e78e0c92392a4e39099835cf7e6ab535b2227');
contracts.set('rewardEscrow', '0xb671f2210b1f6621a2607ea63e6b2dc3e2464d1f');

let v219UpgradeBlock = BigInt.fromI32(9518914); // Archernar v2.19.x Feb 20, 2020

// [reference only] Synthetix v2.10.x (bytes4 to bytes32) at txn
// https://etherscan.io/tx/0x612cf929f305af603e165f4cb7602e5fbeed3d2e2ac1162ac61087688a5990b6
// let v2100UpgradeBlock = BigInt.fromI32(8622911);

// Synthetix v2.0.0 (rebrand from Havven and adding Multicurrency) at txn
// https://etherscan.io/tx/0x4b5864b1e4fdfe0ab9798de27aef460b124e9039a96d474ed62bd483e10c835a
let v200UpgradeBlock = BigInt.fromI32(6841188); // Dec 7, 2018

// Havven v1.0.1 release at txn
// https://etherscan.io/tx/0x7d5e4d92c702d4863ed71d5c1348e9dec028afd8d165e673d4b6aea75c8b9e2c
let v101UpgradeBlock = BigInt.fromI32(5873222); // June 29, 2018 (nUSDa.1)

// [reference only] Havven v1.0.0 release at txn
// https://etherscan.io/tx/0x1c3b873d0ce0dfafff428fc019bc9f630ac51031fc6021e57fb24c65143d328a
// let v100UpgradeBlock = BigInt.fromI32(5762355); // June 10, 2018 (nUSDa)

// [reference only] ProxySynthetix creation
// https://etherscan.io/tx/0xa733e675705a8af67f4f82df796be763d4f389a45216a89bf5d09f7e7d1aec11
// let proxySynthetixBlock = BigInt.fromI32(5750875); //  June 8, 2018

// [reference only] Havven v0.1.0 (0xf244176246168f24e3187f7288edbca29267739b)
// https://etherscan.io/tx/0x7770e66f2be4f32caa929fe671a5fc4fd134227812f2ef80612395c8f3dade50
// let initialHavvenBlock = BigInt.fromI32(5238336); // Mar 11, 2018 (eUSD)

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

function decrementMetadata(field: string): void {
  let metadata = getMetadata();
  if (field == 'issuers') {
    metadata.issuers = metadata.issuers.minus(BigInt.fromI32(1));
  } else if (field == 'snxHolders') {
    metadata.snxHolders = metadata.snxHolders.minus(BigInt.fromI32(1));
  }
  metadata.save();
}

function trackIssuer(account: Address): void {
  let existingIssuer = Issuer.load(account.toHex());
  if (existingIssuer == null) {
    incrementMetadata('issuers');
  }
  let issuer = new Issuer(account.toHex());

  issuer.save();
}

let synthetixStateAsBytes = ByteArray.fromHexString(
  '0x53796e7468657469785374617465000000000000000000000000000000000000',
) as Bytes;

function trackSNXHolder(snxContract: Address, account: Address, block: ethereum.Block): void {
  let holder = account.toHex();
  // ignore escrow accounts
  if (contracts.get('escrow') == holder || contracts.get('rewardEscrow') == holder) {
    return;
  }
  let existingSNXHolder = SNXHolder.load(account.toHex());
  let snxHolder = new SNXHolder(account.toHex());
  snxHolder.block = block.number;
  snxHolder.timestamp = block.timestamp;
  if (existingSNXHolder == null && snxHolder.balanceOf > BigInt.fromI32(0)) {
    incrementMetadata('snxHolders');
  } else if (existingSNXHolder != null && snxHolder.balanceOf == BigInt.fromI32(0)) {
    decrementMetadata('snxHolders');
  }
  // // Don't bother trying these extra fields before v2 upgrade (slows down The Graph processing to do all these as try_ calls)
  if (block.number > v219UpgradeBlock) {
    let synthetix = SNX.bind(snxContract);
    snxHolder.balanceOf = synthetix.balanceOf(account);
    snxHolder.collateral = synthetix.collateral(account);

    // Check transferable because it will be null when rates are stale
    let transferableTry = synthetix.try_transferableSynthetix(account);
    if (!transferableTry.reverted) {
      snxHolder.transferable = transferableTry.value;
    }
    let resolverAddress = synthetix.resolver();
    let resolver = AddressResolver.bind(resolverAddress);
    let synthetixState = SynthetixState.bind(resolver.getAddress(synthetixStateAsBytes));
    let issuanceData = synthetixState.issuanceData(account);
    snxHolder.initialDebtOwnership = issuanceData.value0;
    snxHolder.debtEntryAtIndex = synthetixState.debtLedger(issuanceData.value1);
  } else if (block.number > v200UpgradeBlock) {
    // Synthetix32 or Synthetix4
    let synthetix = Synthetix32.bind(snxContract);
    // Track all the staking information relevant to this SNX Holder
    snxHolder.balanceOf = synthetix.balanceOf(account);
    snxHolder.collateral = synthetix.collateral(account);
    // Note: Below we try_transferableSynthetix as it uses debtBalanceOf, which eventually calls ExchangeRates.abs
    // It's slower to use try but this protects against instances when Transfers were enabled
    // yet ExchangeRates were stale and throwing errors when calling effectiveValue.
    // E.g. https://etherscan.io/tx/0x5368339311aafeb9f92c5b5d84faa4864c2c3878681a402bbf0aabff60bafa08
    let transferableTry = synthetix.try_transferableSynthetix(account);
    if (!transferableTry.reverted) {
      snxHolder.transferable = transferableTry.value;
    }
    let stateTry = synthetix.try_synthetixState();
    if (!stateTry.reverted) {
      let synthetixStateContract = synthetix.synthetixState();
      let synthetixState = SynthetixState.bind(synthetixStateContract);
      let issuanceData = synthetixState.issuanceData(account);
      snxHolder.initialDebtOwnership = issuanceData.value0;
      snxHolder.debtEntryAtIndex = synthetixState.debtLedger(issuanceData.value1);
    }
  } else if (block.number > v101UpgradeBlock) {
    // When we were Havven, simply track their collateral (SNX balance and escrowed balance)
    let synthetix = Synthetix4.bind(snxContract); // not the correct ABI/contract for pre v2 but should suffice
    snxHolder.balanceOf = synthetix.balanceOf(account);
    let collateralTry = synthetix.try_collateral(account);
    if (!collateralTry.reverted) {
      snxHolder.collateral = collateralTry.value;
    }
  } else {
    let synthetix = Synthetix4.bind(snxContract); // not the correct ABI/contract for pre v2 but should suffice
    snxHolder.balanceOf = synthetix.balanceOf(account);
  }

  snxHolder.save();
}

export function handleTransferSNX(event: SNXTransferEvent): void {
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'SNX';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();

  trackSNXHolder(event.address, event.params.from, event.block);
  trackSNXHolder(event.address, event.params.to, event.block);
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  let contract = Synth.bind(event.address);
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
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
}

/**
 * Track when underlying contracts change
 */
function contractUpdate(source: string, target: Address, block: ethereum.Block, hash: Bytes): void {
  let entity = new ContractUpdated(hash.toHex());
  entity.source = source;
  entity.target = target;
  entity.block = block.number;
  entity.timestamp = block.timestamp;
  entity.save();
}

export function handleProxyTargetUpdated(event: TargetUpdatedEvent): void {
  contractUpdate('Synthetix', event.params.newTarget, event.block, event.transaction.hash);
}

// export function handleSetExchangeRates(call: SetExchangeRatesCall): void {
//   contractUpdate('ExchangeRates', call.inputs._exchangeRates, call.block, call.transaction.hash);
// }

// export function handleSetFeePool(call: SetFeePoolCall): void {
//   contractUpdate('FeePool', call.inputs._feePool, call.block, call.transaction.hash);
// }

/**
 * Handle reward vest events so that we know which addresses have rewards, and
 * to recalculate SNX Holders staking details.
 */
// Note: we use VestedEvent here even though is also handles VestingEntryCreated (they share the same signature)
export function handleRewardVestEvent(event: VestedEvent): void {
  let entity = new RewardEscrowHolder(event.params.beneficiary.toHex());
  let contract = RewardEscrow.bind(event.address);
  entity.balanceOf = contract.balanceOf(event.params.beneficiary);
  entity.save();
  // now track the SNX holder as this action can impact their collateral
  let synthetixAddress = contract.synthetix();
  trackSNXHolder(synthetixAddress, event.params.beneficiary, event.block);
}

function _handleIssueSynths(
  txn: ethereum.Transaction,
  block: ethereum.Block,
  to: Address,
  source: string,
  amount?: BigInt,
): void {
  let entity = new Issued(txn.hash.toHex());
  entity.account = txn.from;

  if (amount != null) {
    entity.value = amount;
  }
  entity.source = source;

  entity.timestamp = block.timestamp;
  entity.block = block.number;
  entity.gasPrice = txn.gasPrice;
  entity.save();

  // track this issuer for reference
  trackIssuer(txn.from);

  // update SNX holder details
  trackSNXHolder(to, txn.from, block);
}

export function handleIssueSynthsUSD(call: IssueSynthsCall): void {
  _handleIssueSynths(call.transaction, call.block, call.to, 'sUSD', call.inputs.amount);
}
export function handleIssueSynths(call: IssueSynthsCall32): void {
  _handleIssueSynths(call.transaction, call.block, call.to, call.inputs.currencyKey.toString(), call.inputs.amount);
}
export function handleIssueMaxSynthsUSD(call: IssueMaxSynthsCall): void {
  // Annoying to have to do this - we can't get the amount
  // we don't know how much because remainingIssuableSynths(call.transaction.from, currencyKey)
  // will show the anounbt after
  // entity.value = call.inputs.amount;
  _handleIssueSynths(call.transaction, call.block, call.to, 'sUSD', null);
}

export function handleIssueMaxSynths(call: IssueMaxSynthsCall32): void {
  _handleIssueSynths(call.transaction, call.block, call.to, call.inputs.currencyKey.toString(), null);
}

function _handleBurnSnths(
  txn: ethereum.Transaction,
  block: ethereum.Block,
  to: Address,
  source: string,
  amount: BigInt,
): void {
  let entity = new Burned(txn.hash.toHex());
  entity.account = txn.from;

  entity.value = amount;
  entity.source = source;
  entity.timestamp = block.timestamp;
  entity.block = block.number;
  entity.gasPrice = txn.gasPrice;
  entity.save();

  // update SNX holder details
  trackSNXHolder(to, txn.from, block);
}

export function handleBurnSynthsUSD(call: BurnSynthsCall): void {
  _handleBurnSnths(call.transaction, call.block, call.to, 'sUSD', call.inputs.amount);
}

export function handleBurnSynths(call: BurnSynthsCall32): void {
  _handleBurnSnths(call.transaction, call.block, call.to, call.inputs.currencyKey.toString(), call.inputs.amount);
}

export function handleFeesClaimed(event: FeesClaimedEvent): void {
  let entity = new FeesClaimed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.account;
  entity.value = event.params.sUSDAmount;
  entity.rewards = event.params.snxRewards;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;

  entity.save();
}
