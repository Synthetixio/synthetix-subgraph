import {
  Synthetix as SNX,
  Transfer as TransferEvent,
  IssueSynthsCall,
  BurnSynthsCall,
  SetExchangeRatesCall,
  SetFeePoolCall,
} from '../generated/Synthetix/Synthetix';
import { SynthetixState } from '../generated/Synthetix/SynthetixState';
import { TargetUpdated as TargetUpdatedEvent } from '../generated/ProxySynthetix/Proxy';
import { Vested as VestedEvent, RewardEscrow } from '../generated/RewardEscrow/RewardEscrow';
import { Synth, Transfer as SynthTransferEvent } from '../generated/SynthsUSD/Synth';
import {
  Synthetix,
  Transfer,
  Issued,
  Burned,
  Issuer,
  ContractUpdated,
  SNXHolder,
  RewardEscrowHolder,
} from '../generated/schema';

import { BigInt, Address, EthereumBlock, Bytes } from '@graphprotocol/graph-ts';

let contracts = new Map<string, string>();
contracts.set('escrow', '0x971e78e0c92392a4e39099835cf7e6ab535b2227');
contracts.set('rewardEscrow', '0xb671f2210b1f6621a2607ea63e6b2dc3e2464d1f');

// [reference only] Synthetix v2.10.x (bytes4 to bytes32) at txn
// https://etherscan.io/tx/0x612cf929f305af603e165f4cb7602e5fbeed3d2e2ac1162ac61087688a5990b6
// let v2100UpgradeBlock = BigInt.fromI32(8622911);

// Synthetix v2.0.0 (rebrand from Havven and adding Multicurrency) at txn
// https://etherscan.io/tx/0x4a19db6cd8f01226bfe74a1a194f971e5d19568b019a45efd0dfbcaf9a901b02
let v200UpgradeBlock = BigInt.fromI32(6840246);

// Havven v1.0.1 release at txn
// https://etherscan.io/tx/0xd71402e7e06c669867f2ece75a5cdcbdd8bae764847bbc089d6fc549af1ad232
let v101UpgradeBlock = BigInt.fromI32(5873039);

// [reference only] Havven v1.0.0 release at txn
// https://etherscan.io/tx/0x1c3b873d0ce0dfafff428fc019bc9f630ac51031fc6021e57fb24c65143d328a
// let v100UpgradeBlock = BigInt.fromI32(5762355);

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

  // Don't bother trying these extra fields before v2 upgrade (slows down The Graph processing to do all these as try_ calls)
  if (block > v200UpgradeBlock) {
    // Track all the staking information relevatn to this SNX Holder
    snxHolder.collateral = synthetix.collateral(account);
    snxHolder.collateralisationRatio = synthetix.collateralisationRatio(account);
    let synthetixStateContract = synthetix.synthetixState();
    let synthetixState = SynthetixState.bind(synthetixStateContract);
    let issuanceRatio = synthetixState.issuanceRatio();
    let lockedRatio = snxHolder.collateralisationRatio.div(issuanceRatio);
    if (lockedRatio > BigInt.fromI32(1)) {
      lockedRatio = BigInt.fromI32(1);
    }
    snxHolder.lockedRatio = lockedRatio;
    let issuanceData = synthetixState.issuanceData(account);
    snxHolder.initialDebtOwnership = issuanceData.value0;
    snxHolder.debtEntryAtIndex = synthetixState.debtLedger(issuanceData.value1);
  } else if (block > v101UpgradeBlock) {
    // When we were Havven, simply track their collateral (SNX balance and escrowed balance)
    let collateralTry = synthetix.try_collateral(account);
    if (!collateralTry.reverted) {
      snxHolder.collateral = collateralTry.value;
    } else {
      snxHolder.collateral = synthetix.balanceOf(account);
    }
  } else {
    // prior to this the full collateral was Havven.availableHavvens()
    // Not dealing with this for now, we'll stick with balanceOf and
    // accept escrowed Havvens from the ICO sale are not included - JJ
    snxHolder.collateral = synthetix.balanceOf(account);
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
function contractUpdate(source: string, target: Address, block: EthereumBlock, hash: Bytes): void {
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

export function handleSetExchangeRates(call: SetExchangeRatesCall): void {
  contractUpdate('ExchangeRates', call.inputs._exchangeRates, call.block, call.transaction.hash);
}

export function handleSetFeePool(call: SetFeePoolCall): void {
  contractUpdate('FeePool', call.inputs._feePool, call.block, call.transaction.hash);
}

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

  // track this issuer for reference
  trackIssuer(call.transaction.from);

  // update SNX holder details
  trackSNXHolder(call.to, call.transaction.from, call.block.number);
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

  // update SNX holder details
  trackSNXHolder(call.to, call.transaction.from, call.block.number);
}
