import {
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
  LoanLiquidated as LoanLiquidatedEvent,
} from '../generated/EtherCollateral/EtherCollateral';

import {
  LoanPartiallyLiquidated as LoanPartiallyLiquidatedEvent,
  CollateralDeposited as CollateralDepositedEvent,
  CollateralWithdrawn as CollateralWithdrawnEvent,
  LoanRepaid as LoanRepaidEvent,
} from '../generated/EtherCollateralsUSD/EtherCollateralsUSD';

import {
  Loan,
  LoanCreated,
  LoanClosed,
  LoanLiquidated,
  LoanPartiallyLiquidated,
  CollateralDeposited,
  CollateralWithdrawn,
  LoanRepaid,
} from '../generated/schema';

import { log } from '@graphprotocol/graph-ts';

export function handleLoanCreatedEther(event: LoanCreatedEvent): void {
  let loanEntity = addLoanEntity(event);
  loanEntity.collateralMinted = 'sETH';
  loanEntity.save();

  let loanCreatedEntity = addLoanCreatedEntity(event);
  loanCreatedEntity.collateralMinted = 'sETH';
  loanCreatedEntity.save();
}

export function handleLoanCreatedsUSD(event: LoanCreatedEvent): void {
  let loanEntity = addLoanEntity(event);
  loanEntity.collateralMinted = 'sUSD';
  loanEntity.save();

  let loanCreatedEntity = addLoanCreatedEntity(event);
  loanCreatedEntity.collateralMinted = 'sUSD';
  loanCreatedEntity.save();
}

function addLoanEntity(event: LoanCreatedEvent): Loan {
  let loanEntity = new Loan(event.params.loanID.toHex());
  loanEntity.txHash = event.transaction.hash.toHex();
  loanEntity.account = event.params.account;
  loanEntity.amount = event.params.amount;
  loanEntity.hasPartialLiquidations = false;
  loanEntity.isOpen = true;
  loanEntity.createdAt = event.block.timestamp;
  return loanEntity;
}

function addLoanCreatedEntity(event: LoanCreatedEvent): LoanCreated {
  let loanCreatedEntity = new LoanCreated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  loanCreatedEntity.account = event.params.account;
  loanCreatedEntity.amount = event.params.amount;
  loanCreatedEntity.loanId = event.params.loanID;
  loanCreatedEntity.timestamp = event.block.timestamp;
  return loanCreatedEntity;
}

export function handleLoanClosed(event: LoanClosedEvent): void {
  let loanEntity = Loan.load(event.params.loanID.toHex());
  let loanClosedEntity = new LoanClosed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  loanEntity.isOpen = false;
  loanEntity.closedAt = event.block.timestamp;
  loanEntity.save();

  loanClosedEntity.account = event.params.account;
  loanClosedEntity.loanId = event.params.loanID;
  loanClosedEntity.feesPaid = event.params.feesPaid;
  loanClosedEntity.timestamp = event.block.timestamp;
  loanClosedEntity.save();
}

// NOTE no need to close the loan here as the LoanClosed event was emitted directly prior to this event
export function handleLoanLiquidated(event: LoanLiquidatedEvent): void {
  let loanLiquidatedEntity = new LoanLiquidated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  loanLiquidatedEntity.loanId = event.params.loanID;
  loanLiquidatedEntity.account = event.params.account;
  loanLiquidatedEntity.liquidator = event.params.liquidator;
  loanLiquidatedEntity.timestamp = event.block.timestamp;
  loanLiquidatedEntity.save();
}

export function handleLoanPartiallyLiquidated(event: LoanPartiallyLiquidatedEvent): void {
  let loanPartiallyLiquidatedEntity = new LoanPartiallyLiquidated(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  );
  loanPartiallyLiquidatedEntity.loanId = event.params.loanID;
  loanPartiallyLiquidatedEntity.account = event.params.account;
  loanPartiallyLiquidatedEntity.liquidator = event.params.liquidator;
  loanPartiallyLiquidatedEntity.liquidatedAmount = event.params.liquidatedAmount;
  loanPartiallyLiquidatedEntity.liquidatedCollateral = event.params.liquidatedCollateral;
  loanPartiallyLiquidatedEntity.timestamp = event.block.timestamp;
  loanPartiallyLiquidatedEntity.save();

  let loanEntity = Loan.load(event.params.loanID.toHex());
  if (loanEntity == null) {
    log.error('for handleLoanPartiallyLiquidated there should be a loan entity for this id: {} in this hash: {}', [
      event.params.loanID.toHex(),
      event.transaction.hash.toHex(),
    ]);
    return;
  }
  loanEntity.hasPartialLiquidations = true;
  loanEntity.amount = loanEntity.amount.minus(event.params.liquidatedAmount);
  loanEntity.save();
}

export function handleCollateralDeposited(event: CollateralDepositedEvent): void {
  let collateralDepositedEntity = new CollateralDeposited(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  );
  collateralDepositedEntity.collateralAmount = event.params.collateralAmount;
  collateralDepositedEntity.collateralAfter = event.params.collateralAfter;
  collateralDepositedEntity.loanId = event.params.loanID;
  collateralDepositedEntity.account = event.params.account;
  collateralDepositedEntity.timestamp = event.block.timestamp;
  collateralDepositedEntity.save();
}

export function handleCollateralWithdrawn(event: CollateralWithdrawnEvent): void {
  let collateralWithdrawnEntity = new CollateralWithdrawn(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  );
  collateralWithdrawnEntity.amountWithdrawn = event.params.amountWithdrawn;
  collateralWithdrawnEntity.collateralAfter = event.params.collateralAfter;
  collateralWithdrawnEntity.loanId = event.params.loanID;
  collateralWithdrawnEntity.account = event.params.account;
  collateralWithdrawnEntity.timestamp = event.block.timestamp;
  collateralWithdrawnEntity.save();
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let loanRepaid = new LoanRepaid(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  loanRepaid.repaidAmount = event.params.repaidAmount;
  loanRepaid.newLoanAmount = event.params.newLoanAmount;
  loanRepaid.loanId = event.params.loanID;
  loanRepaid.account = event.params.account;
  loanRepaid.timestamp = event.block.timestamp;
  loanRepaid.save();

  let loanEntity = Loan.load(event.params.loanID.toHex());
  if (loanEntity == null) {
    log.error('for handleLoanRepaid there should be a loan entity for this id: {} in this hash: {}', [
      event.params.loanID.toHex(),
      event.transaction.hash.toHex(),
    ]);
    return;
  }
  loanEntity.amount = loanRepaid.newLoanAmount;
  loanEntity.save();
}
