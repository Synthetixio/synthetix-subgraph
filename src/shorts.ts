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
} from '../generated/subgraphs/synthetix-shorts/CollateralShort_0/CollateralShort';

import {
  Short,
  ShortLiquidation,
  ShortCollateralChange,
  ShortLoanChange,
  ShortContract,
  ShortContractUpdate,
} from '../generated/subgraphs/synthetix-shorts/schema';

import { BigInt, Bytes, log, Address } from '@graphprotocol/graph-ts';

import { strToBytes } from './lib/helpers';

function saveContractLevelUpdate(
  txHash: string,
  logIndex: string,
  field: string,
  value: string,
  timestamp: BigInt,
  blockNumber: BigInt,
  shortContract: ShortContract,
): void {
  let shortContractUpdateEntity = new ShortContractUpdate(txHash + '-' + logIndex);
  shortContractUpdateEntity.field = field;
  shortContractUpdateEntity.value = value;
  shortContractUpdateEntity.timestamp = timestamp;
  shortContractUpdateEntity.blockNumber = blockNumber;
  shortContractUpdateEntity.contractData = shortContract.id;
  shortContractUpdateEntity.save();
}

function addContractData(
  contractAddress: Address,
  txHash: string,
  logIndex: string,
  timestamp: BigInt,
  blockNumber: BigInt,
): ShortContract {
  let collateralShortContract = CollateralShortContract.bind(contractAddress);
  let shortContractEntity = ShortContract.load(contractAddress.toHex());
  if (shortContractEntity == null) {
    shortContractEntity = new ShortContract(contractAddress.toHex());
    saveContractLevelUpdate(
      txHash,
      logIndex,
      'issueFeeRate',
      collateralShortContract.issueFeeRate().toString(),
      timestamp,
      blockNumber,
      shortContractEntity as ShortContract,
    );
  }
  shortContractEntity.minCratio = collateralShortContract.minCratio();
  shortContractEntity.minCollateral = collateralShortContract.minCollateral();
  shortContractEntity.maxLoansPerAccount = collateralShortContract.maxLoansPerAccount();
  shortContractEntity.issueFeeRate = collateralShortContract.issueFeeRate();
  shortContractEntity.interactionDelay = collateralShortContract.interactionDelay();
  shortContractEntity.manager = collateralShortContract.manager();
  shortContractEntity.canOpenLoans = collateralShortContract.canOpenLoans();
  shortContractEntity.save();
  return shortContractEntity as ShortContract;
}

function loadContractData(
  contractAddress: Address,
  txHash: string,
  logIndex: string,
  timestamp: BigInt,
  blockNumber: BigInt,
): ShortContract {
  let shortContractEntity = ShortContract.load(contractAddress.toHex());
  if (shortContractEntity == null) {
    shortContractEntity = addContractData(contractAddress, txHash, logIndex, timestamp, blockNumber);
  }
  return shortContractEntity as ShortContract;
}

function createShort(event: LoanCreatedEvent, collateralLocked: Bytes): void {
  let contractData: ShortContract = addContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );

  let shortEntity = new Short(event.params.id.toString());
  shortEntity.contractData = contractData.id;
  shortEntity.txHash = event.transaction.hash.toHex();
  shortEntity.account = event.params.account;
  shortEntity.collateralLocked = collateralLocked;
  shortEntity.collateralLockedAmount = event.params.collateral;
  shortEntity.synthBorrowed = event.params.currency;
  shortEntity.synthBorrowedAmount = event.params.amount;
  shortEntity.isOpen = true;
  shortEntity.createdAt = event.block.timestamp;
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.createdAtBlock = event.block.number;
  shortEntity.save();
  saveLoanChangeEntity(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    false,
    event.params.amount,
    shortEntity.synthBorrowedAmount,
    event.block.timestamp,
    event.block.number,
    shortEntity as Short,
  );
}

function handleDepositOrWithdrawal(
  id: string,
  txHash: string,
  logIndex: string,
  amount: BigInt,
  collateralAfter: BigInt,
  isDeposit: boolean,
  timestamp: BigInt,
  blockNumber: BigInt,
): void {
  let shortEntity = Short.load(id);
  if (shortEntity == null) {
    log.error('trying to withdraw or deposit collateral on a loan that does not exist with id: {} from txHash: {}', [
      id,
      txHash,
    ]);
    return;
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
  shortEntity.accruedInterestLastUpdateTimestamp = timestamp;
  shortEntity.save();
  let shortCollateralChangeEntity = new ShortCollateralChange(txHash + '-' + logIndex);
  shortCollateralChangeEntity.isDeposit = isDeposit;
  shortCollateralChangeEntity.amount = amount;
  shortCollateralChangeEntity.collateralAfter = collateralAfter;
  shortCollateralChangeEntity.timestamp = timestamp;
  shortCollateralChangeEntity.short = shortEntity.id;
  shortCollateralChangeEntity.blockNumber = blockNumber;
  shortCollateralChangeEntity.save();
}

function saveLoanChangeEntity(
  txHash: string,
  logIndex: string,
  isRepayment: boolean,
  amount: BigInt,
  amountAfter: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
  shortEntity: Short,
): void {
  let shortLoanChangeEntity = new ShortLoanChange(txHash + '-' + logIndex);
  shortLoanChangeEntity.isRepayment = isRepayment;
  shortLoanChangeEntity.amount = amount;
  shortLoanChangeEntity.loanAfter = amountAfter;
  shortLoanChangeEntity.timestamp = timestamp;
  shortLoanChangeEntity.blockNumber = blockNumber;
  shortLoanChangeEntity.short = shortEntity.id;
  shortLoanChangeEntity.save();
}

function handleLiquidations(
  txHash: string,
  logIndex: string,
  loanId: string,
  isClosed: boolean,
  liquidatedAmount: BigInt,
  liquidatedCollateral: BigInt,
  liquidator: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
): void {
  let shortEntity = Short.load(loanId);
  if (shortEntity == null) {
    log.error('trying to liquidate a loan that does not exist with id: {} from txHash: {}', [loanId, txHash]);
    return;
  }
  if (isClosed) {
    shortEntity.isOpen = false;
  }
  shortEntity.accruedInterestLastUpdateTimestamp = timestamp;
  shortEntity.collateralLockedAmount = shortEntity.collateralLockedAmount.minus(liquidatedCollateral);
  shortEntity.synthBorrowedAmount = shortEntity.synthBorrowedAmount.minus(liquidatedAmount);
  shortEntity.save();
  let shortLiquidationEntity = new ShortLiquidation(txHash + '-' + logIndex);
  shortLiquidationEntity.liquidator = liquidator;
  shortLiquidationEntity.isClosed = isClosed;
  shortLiquidationEntity.liquidatedAmount = liquidatedAmount;
  shortLiquidationEntity.liquidatedCollateral = liquidatedCollateral;
  shortLiquidationEntity.timestamp = timestamp;
  shortLiquidationEntity.blockNumber = blockNumber;
  shortLiquidationEntity.short = shortEntity.id;
  shortLiquidationEntity.save();
}

export function handleShortLoanCreatedsUSD(event: LoanCreatedEvent): void {
  createShort(event, strToBytes('sUSD', 32));
}

export function handleShortLoanClosedsUSD(event: LoanClosedEvent): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error('trying to close a loan that does not exist with id: {} from txHash: {}', [
      event.params.id.toString(),
      event.transaction.hash.toHex(),
    ]);
    return;
  }
  shortEntity.isOpen = false;
  shortEntity.closedAt = event.block.timestamp;
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.synthBorrowedAmount = BigInt.fromI32(0);
  shortEntity.collateralLockedAmount = BigInt.fromI32(0);
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
    event.block.number,
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
    event.block.number,
  );
}

export function handleShortLoanRepaymentMadesUSD(event: LoanRepaymentMadeEvent): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error('trying to repay on a loan that does not exist with id: {} from txHash: {}', [
      event.params.id.toString(),
      event.transaction.hash.toHex(),
    ]);
    return;
  }
  let newTotal = shortEntity.synthBorrowedAmount.minus(event.params.amountRepaid);
  if (event.params.amountAfter.notEqual(newTotal)) {
    log.error(
      'for short loan replayment there is a math error where amountAfter: {} does not equal current synthBorrowedAmount: {} minus new repayment: {}, which totals to: {}',
      [
        event.params.amountAfter.toString(),
        shortEntity.synthBorrowedAmount.toString(),
        event.params.amountRepaid.toString(),
        newTotal.toString(),
      ],
    );
  }
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.synthBorrowedAmount = event.params.amountAfter;
  shortEntity.save();
  saveLoanChangeEntity(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    true,
    event.params.amountRepaid,
    event.params.amountAfter,
    event.block.timestamp,
    event.block.number,
    shortEntity as Short,
  );
}

// NOTE the drawn down event should pass the amount after like the repayment event
export function handleShortLoanDrawnDownsUSD(event: LoanDrawnDownEvent): void {
  let shortEntity = Short.load(event.params.id.toString());
  if (shortEntity == null) {
    log.error('trying to increase a loan that does not exist with id: {} from txHash: {}', [
      event.params.id.toString(),
      event.transaction.hash.toHex(),
    ]);
    return;
  }
  shortEntity.synthBorrowedAmount = shortEntity.synthBorrowedAmount.plus(event.params.amount);
  shortEntity.accruedInterestLastUpdateTimestamp = event.block.timestamp;
  shortEntity.save();
  saveLoanChangeEntity(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    false,
    event.params.amount,
    shortEntity.synthBorrowedAmount,
    event.block.timestamp,
    event.block.number,
    shortEntity as Short,
  );
}

export function handleLoanPartiallyLiquidatedsUSD(event: LoanPartiallyLiquidatedEvent): void {
  handleLiquidations(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.params.id.toString(),
    false,
    event.params.amountLiquidated,
    event.params.collateralLiquidated,
    event.params.liquidator,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleLoanClosedByLiquidationsUSD(event: LoanClosedByLiquidationEvent): void {
  handleLiquidations(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.params.id.toString(),
    true,
    event.params.amountLiquidated,
    event.params.collateralLiquidated,
    event.params.liquidator,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleMinCratioRatioUpdatedsUSD(event: MinCratioRatioUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.minCratio = event.params.minCratio;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'minCratio',
    event.params.minCratio.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}

export function handleMinCollateralUpdatedsUSD(event: MinCollateralUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.minCollateral = event.params.minCollateral;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'minCollateral',
    event.params.minCollateral.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}

export function handleIssueFeeRateUpdatedsUSD(event: IssueFeeRateUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.issueFeeRate = event.params.issueFeeRate;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'issueFeeRate',
    event.params.issueFeeRate.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}

export function handleMaxLoansPerAccountUpdatedsUSD(event: MaxLoansPerAccountUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.maxLoansPerAccount = event.params.maxLoansPerAccount;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'maxLoansPerAccount',
    event.params.maxLoansPerAccount.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}

export function handleInteractionDelayUpdatedsUSD(event: InteractionDelayUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.interactionDelay = event.params.interactionDelay;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'interactionDelay',
    event.params.interactionDelay.toString(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}

export function handleManagerUpdatedsUSD(event: ManagerUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.manager = event.params.manager;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'manager',
    event.params.manager.toHex(),
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}

export function handleCanOpenLoansUpdatedsUSD(event: CanOpenLoansUpdatedEvent): void {
  let shortContractEntity = loadContractData(
    event.address,
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    event.block.timestamp,
    event.block.number,
  );
  shortContractEntity.canOpenLoans = event.params.canOpenLoans;
  shortContractEntity.save();
  saveContractLevelUpdate(
    event.transaction.hash.toHex(),
    event.logIndex.toString(),
    'canOpenLoans',
    event.params.canOpenLoans ? 'true' : 'false',
    event.block.timestamp,
    event.block.number,
    shortContractEntity as ShortContract,
  );
}