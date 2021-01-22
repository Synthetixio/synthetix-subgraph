import {
  CollateralShort as CollateralShortContract,
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
  CollateralDeposited as CollateralDepositedEvent,
  CollateralWithdrawn as CollateralWithdrawnEvent,
  LoanRepaymentMade as LoanRepaymentMadeEvent,
  LoanDrawnDown as LoanDrawnDownEvent,
  LoanPartiallyLiquidated as LoanPartiallyLiquidatedEvent,
  LoanClosedByLiquidation as LoanClosedByLiquidationEvent,
  MinCratioRatioUpdated as MinCratioRatioUpdatedEvent,
  MinCollateralUpdated as MinCollateralUpdatedEvent,
  IssueFeeRateUpdated as IssueFeeRateUpdatedEvent,
  MaxLoansPerAccountUpdated as MaxLoansPerAccountUpdatedEvent,
  InteractionDelayUpdated as InteractionDelayUpdatedEvent,
  ManagerUpdated as ManagerUpdatedEvent,
  CanOpenLoansUpdated as CanOpenLoansUpdatedEvent,
} from '../generated/CollateralShort/CollateralShort';

import { Short, ShortLiquidation, ShortCollateralChange, ShortLoanChange, ShortContract } from '../generated/schema';

import { BigInt, ByteArray, log, ethereum } from '@graphprotocol/graph-ts';

import { strToBytes } from './common';

function addContractData(contractAddress: ByteArray): ShortContract {
  let collateralShortContract = new CollateralShortContract.bind(contractAddress);
  let shortContractEntity = ShortContract.load(contractAddress.toHex());
  if (shortContractEntity == null) {
    shortContractEntity = new ShortContract(contractAddress.toHex());
  }
  shortContractEntity.minCratio = collateralShortContract.minCratio();
  shortContractEntity.minCollateral = collateralShortContract.minCollateral();
  shortContractEntity.maxLoansPerAccount = collateralShortContract.maxLoansPerAccount();
  shortContractEntity.interactionDelay = collateralShortContract.interactionDelay();
  shortContractEntity.manager = collateralShortContract.manager();
  shortContractEntity.canOpenLoans = collateralShortContract.canOpenLoans();
  shortContractEntity.save();
  return shortContractEntity;
}

function createShort(event: LoanCreatedEvent, collateralLocked: ByteArray): void {
  let contractData = addContractData(event.address);

  // TODO consider adding issueFeeRate or maybe leave it off since it is on the contract data
  let shortEntity = new Short(event.params.id.toString());
  shortEntity.contractData = contractData;
  shortEntity.txHash = event.transaction.hash.toHex();
  shortEntity.account = event.params.account;
  shortEntity.collateralLocked = collateralLocked;
  shortEntity.collateralLockedAmount = event.params.collateral;
  shortEntity.synthBorrowed = event.params.currency;
  shortEntity.synthBorrowedAmount = event.params.amount;
  shortEntity.amount = event.params.amount;
  shortEntity.isOpen = true;
  shortEntity.createdAt = event.block.timestamp;
  shortEntity.save();
}

function handleDepositOrWithdrawal(
  id: string,
  txHash: string,
  logIndex: string,
  amount: BigInt,
  collateralAfter: BigInt,
  isDeposit: boolean,
  timestamp: BigInt,
) {
  let shortEntity = Short.load(id);
  if (shortEntity == null) {
    return log.error(
      'trying to withdraw or deposit collateral on a loan that does not exist with id: {} from txHash: {}',
      [id, txHash],
    );
  }
  let newTotal: BigInt;
  if (isDeposit) {
    newTotal = shortEntity.collateralLockedAmount.plus(amount);
  } else {
    newTotal = shortEntity.collateralLockedAmount.minus(amount);
  }
  if (collateralAfter.notEqual(newTotal)) {
    log.error(
      'for isDeposit: {}, there is a math error where collateralAfter: {} does not equal current deposit: {} plus or minus new deposit: {}, which totals to: {}',
      [
        isDeposit.toString(),
        collateralAfter.toString(),
        shortEntity.collateralLockedAmount.toString(),
        amount.toString(),
        newTotal.toString(),
      ],
    );
  }
  shortEntity.collateralLockedAmount = collateralAfter;
  shortEntity.save();
  let shortCollateralChangeEntity = new ShortCollateralChange(txHash + '-' + logIndex);
  shortCollateralChangeEntity.isDeposit = isDeposit;
  shortCollateralChangeEntity.amount = amount;
  shortCollateralChangeEntity.collateralAfter = collateralAfter;
  shortCollateralChangeEntity.timestamp = timestamp;
  shortCollateralChangeEntity.short = shortEntity;
  shortCollateralChangeEntity.save();
}

export function handleShortLoanCreatedsUSD(event: LoanCreatedEvent): void {
  return createShort(event, strToBytes('sUSD', 32));
}

export function handleShortLoanClosedsUSD(event: LoanClosedEvent): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    return log.error('trying to close a loan that does not exist with id: {} from txHash: {}', [
      event.params.id.toString(),
      event.transaction.hash.toHex(),
    ]);
  }
  shortEntity.isOpen = false;
  shortEntity.closedAt = event.block.timestamp;
  shortEntity.save();
}

export function handleShortCollateralDepositedsUSD(event: CollateralDepositedEvent): void {
  handleDepositOrWithdrawal(
    event.params.id.toString(),
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.params.amountDeposited,
    event.params.collateralAfter,
    true,
    event.block.timestamp,
  );
}

export function handleShortCollateralWithdrawnsUSD(event: CollateralWithdrawnEvent): void {
  handleDepositOrWithdrawal(
    event.params.id.toString(),
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.params.amountWithdrawn,
    event.params.collateralAfter,
    false,
    event.block.timestamp,
  );
}

// - event: LoanRepaymentMade(indexed address,indexed address,uint256,uint256,uint256)
// handler: handleShortLoanRepaymentMadesUSD
// - event: LoanDrawnDown(indexed address,uint256,unit256)
// handler: handleShortLoanDrawnDownsUSD
// - event: LoanPartiallyLiquidated(indexed address,uint256,address,uint256,uint256)
// handler: handleLoanPartiallyLiquidatedsUSD
// - event: LoanClosedByLiquidation(indexed address,uint256,address,uint256,uint256)
// handler: handleLoanClosedByLiquidationsUSD
// - event: MinCratioRatioUpdated(uint256)
// handler: handleMinCratioRatioUpdatedsUSD
// - event: MinCollateralUpdated(uint256)
// handler: handleMinCollateralUpdatedsUSD
// - event: IssueFeeRateUpdated(uint256)
// handler: handleIssueFeeRateUpdatedsUSD
// - event: MaxLoansPerAccountUpdated(uint256)
// handler: handleMaxLoansPerAccountUpdatedsUSD
// - event: InteractionDelayUpdated(uint256)
// handler: handleInteractionDelayUpdatedsUSD
// - event: ManagerUpdated(address)
// handler: handleManagerUpdatedsUSD
// - event: CanOpenLoansUpdated(bool)
// handler: handleCanOpenLoansUpdatedsUSD
