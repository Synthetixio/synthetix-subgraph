// The latest Synthetix and event invocations

import { AddressResolver } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/AddressResolver';
import { Synthetix as SNX } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/Synthetix';
import { SynthetixState } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/SynthetixState';
import { SystemSettings as SystemSettingsContract } from '../generated/subgraphs/periodic-updates/periodicUpdates_ProxyERC20_0/SystemSettings';

import { strToBytes, toDecimal } from './lib/helpers';

// SynthetixState has not changed ABI since deployment

import { DebtState, SystemSettings } from '../generated/subgraphs/periodic-updates/schema';

import { BigInt, Address, ethereum, dataSource, log } from '@graphprotocol/graph-ts';
import { getContractDeployment } from '../generated/addresses';

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(BigInt.fromI32(6000)).equals(BigInt.fromI32(0))) {
    trackSystemSettings(block);
  }
  if (block.number.mod(BigInt.fromI32(25)).equals(BigInt.fromI32(0))) {
    trackGlobalDebt(block);
  }
}

export function trackSystemSettings(block: ethereum.Block): void {
  let timeSlot = block.timestamp.minus(block.timestamp.mod(BigInt.fromI32(900)));

  let curSystemSettings = SystemSettings.load(timeSlot.toString());

  if (curSystemSettings == null) {
    let systemSettingsAddress = getContractDeployment('SystemSettings', dataSource.network(), block.number)!;
    let systemSettings = SystemSettingsContract.bind(systemSettingsAddress);
    let systemSettingsEntity = new SystemSettings(timeSlot.toString());
    systemSettingsEntity.timestamp = block.timestamp;

    let waitingPeriodSecs = systemSettings.try_waitingPeriodSecs();
    if (!waitingPeriodSecs.reverted) {
      systemSettingsEntity.waitingPeriodSecs = waitingPeriodSecs.value;
    }

    let priceDeviationThresholdFactor = systemSettings.try_priceDeviationThresholdFactor();
    if (!priceDeviationThresholdFactor.reverted) {
      systemSettingsEntity.priceDeviationThresholdFactor = priceDeviationThresholdFactor.value;
    }

    let issuanceRatio = systemSettings.try_issuanceRatio();
    if (!issuanceRatio.reverted) {
      systemSettingsEntity.issuanceRatio = issuanceRatio.value;
    }

    let feePeriodDuration = systemSettings.try_feePeriodDuration();
    if (!feePeriodDuration.reverted) {
      systemSettingsEntity.feePeriodDuration = feePeriodDuration.value;
    }

    let targetThreshold = systemSettings.try_targetThreshold();
    if (!targetThreshold.reverted) {
      systemSettingsEntity.targetThreshold = targetThreshold.value;
    }

    let liquidationDelay = systemSettings.try_liquidationDelay();
    if (!liquidationDelay.reverted) {
      systemSettingsEntity.liquidationDelay = liquidationDelay.value;
    }

    let liquidationRatio = systemSettings.try_liquidationRatio();
    if (!liquidationRatio.reverted) {
      systemSettingsEntity.liquidationRatio = liquidationRatio.value;
    }

    let liquidationPenalty = systemSettings.try_liquidationPenalty();
    if (!liquidationPenalty.reverted) {
      systemSettingsEntity.liquidationPenalty = liquidationPenalty.value;
    }

    let rateStalePeriod = systemSettings.try_rateStalePeriod();
    if (!rateStalePeriod.reverted) {
      systemSettingsEntity.rateStalePeriod = rateStalePeriod.value;
    }

    let debtSnapshotStaleTime = systemSettings.try_debtSnapshotStaleTime();
    if (!debtSnapshotStaleTime.reverted) {
      systemSettingsEntity.debtSnapshotStaleTime = debtSnapshotStaleTime.value;
    }

    let aggregatorWarningFlags = systemSettings.try_aggregatorWarningFlags();
    if (!aggregatorWarningFlags.reverted) {
      systemSettingsEntity.aggregatorWarningFlags = aggregatorWarningFlags.value.toHexString();
    }

    let etherWrapperMaxETH = systemSettings.try_etherWrapperMaxETH();
    if (!etherWrapperMaxETH.reverted) {
      systemSettingsEntity.etherWrapperMaxETH = etherWrapperMaxETH.value;
    }

    let etherWrapperMintFeeRate = systemSettings.try_etherWrapperMintFeeRate();
    if (!etherWrapperMintFeeRate.reverted) {
      systemSettingsEntity.etherWrapperMintFeeRate = etherWrapperMintFeeRate.value;
    }

    let etherWrapperBurnFeeRate = systemSettings.try_etherWrapperBurnFeeRate();
    if (!etherWrapperBurnFeeRate.reverted) {
      systemSettingsEntity.etherWrapperBurnFeeRate = etherWrapperBurnFeeRate.value;
    }

    let atomicMaxVolumePerBlock = systemSettings.try_atomicMaxVolumePerBlock();
    if (!atomicMaxVolumePerBlock.reverted) {
      systemSettingsEntity.atomicMaxVolumePerBlock = atomicMaxVolumePerBlock.value;
    }

    let atomicTwapWindow = systemSettings.try_atomicTwapWindow();
    if (!atomicTwapWindow.reverted) {
      systemSettingsEntity.atomicTwapWindow = atomicTwapWindow.value;
    }

    systemSettingsEntity.save();
  }
}

export function trackGlobalDebt(block: ethereum.Block): void {
  let timeSlot = block.timestamp.minus(block.timestamp.mod(BigInt.fromI32(900)));

  let curDebtState = DebtState.load(timeSlot.toString());

  if (curDebtState == null) {
    let synthetixStateAddress = getContractDeployment('SynthetixState', dataSource.network(), block.number)!;
    let synthetixState = SynthetixState.bind(synthetixStateAddress);

    let synthetix = SNX.bind(dataSource.address());
    let issuedSynths = synthetix.try_totalIssuedSynthsExcludeOtherCollateral(strToBytes('sUSD', 32));

    if (issuedSynths.reverted) {
      issuedSynths = synthetix.try_totalIssuedSynthsExcludeEtherCollateral(strToBytes('sUSD', 32));

      if (issuedSynths.reverted) {
        issuedSynths = synthetix.try_totalIssuedSynths(strToBytes('sUSD', 32));
        if (issuedSynths.reverted) {
          // for some reason this can happen (not sure how)
          log.debug('failed to get issued synths (skip', []);
          return;
        }
      }
    }

    let debtStateEntity = new DebtState(timeSlot.toString());

    let debtEntry = synthetixState.try_lastDebtLedgerEntry();
    if (!debtEntry.reverted) {
      debtStateEntity.debtEntry = toDecimal(debtEntry.value);
      debtStateEntity.totalIssuedSynths = toDecimal(issuedSynths.value);
      debtStateEntity.debtRatio = debtStateEntity.totalIssuedSynths.div(debtStateEntity.debtEntry);
    }
    debtStateEntity.timestamp = block.timestamp;
    debtStateEntity.save();
  }
}
