import {
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
  LoanLiquidated as LoanLiquidatedEvent,
} from '../generated/subgraphs/loans/loans_EtherCollateral_0/EtherCollateral';

import {
  LoanPartiallyLiquidated as LoanPartiallyLiquidatedEvent,
  CollateralDeposited as CollateralDepositedEvent,
  CollateralWithdrawn as CollateralWithdrawnEvent,
  LoanRepaid as LoanRepaidEvent,
} from '../generated/subgraphs/loans/loans_EtherCollateralsUSD_0/EtherCollateralsUSD';

import {
  Loan,
  LoanLiquidated,
  LoanPartiallyLiquidated,
  CollateralDeposited,
  CollateralWithdrawn,
  LoanRepaid,
} from '../generated/subgraphs/loans/schema';

import { log } from '@graphprotocol/graph-ts';
import { toDecimal } from './lib/util';

function addLoanEntity(event: LoanCreatedEvent, collateralMinted: string): Loan {
  let loanEntity = new Loan(event.params.loanID.toHex() + '-' + collateralMinted);
  loanEntity.txHash = event.transaction.hash.toHex();
  loanEntity.account = event.params.account;
  loanEntity.amount = toDecimal(event.params.amount);
  loanEntity.hasPartialLiquidations = false;
  loanEntity.isOpen = true;
  loanEntity.createdAt = event.block.timestamp;
  return loanEntity;
}

export function handleLoanCreatedEther(event: LoanCreatedEvent): void {
  let loanEntity = addLoanEntity(event, 'sETH');
  loanEntity.collateralMinted = 'sETH';
  loanEntity.save();
}

export function handleLoanCreatedsUSD(event: LoanCreatedEvent): void {
  let loanEntity = addLoanEntity(event, 'sUSD');
  loanEntity.collateralMinted = 'sUSD';
  loanEntity.save();
}

function closeLoan(event: LoanClosedEvent, collateralMinted: string): void {
  let loanEntity = Loan.load(event.params.loanID.toHex() + '-' + collateralMinted);

  loanEntity.isOpen = false;
  loanEntity.closedAt = event.block.timestamp;
  loanEntity.save();
}

export function handleLoanClosedEther(event: LoanClosedEvent): void {
  closeLoan(event, 'sETH');
}

export function handleLoanClosedsUSD(event: LoanClosedEvent): void {
  closeLoan(event, 'sUSD');
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
  loanPartiallyLiquidatedEntity.liquidatedAmount = toDecimal(event.params.liquidatedAmount);
  loanPartiallyLiquidatedEntity.liquidatedCollateral = toDecimal(event.params.liquidatedCollateral);
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
  loanEntity.amount = loanEntity.amount.minus(toDecimal(event.params.liquidatedAmount));
  loanEntity.save();
}

export function handleCollateralDeposited(event: CollateralDepositedEvent): void {
  let collateralDepositedEntity = new CollateralDeposited(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  );
  collateralDepositedEntity.collateralAmount = toDecimal(event.params.collateralAmount);
  collateralDepositedEntity.collateralAfter = toDecimal(event.params.collateralAfter);
  collateralDepositedEntity.loanId = event.params.loanID;
  collateralDepositedEntity.account = event.params.account;
  collateralDepositedEntity.timestamp = event.block.timestamp;
  collateralDepositedEntity.save();
}

export function handleCollateralWithdrawn(event: CollateralWithdrawnEvent): void {
  let collateralWithdrawnEntity = new CollateralWithdrawn(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  );
  collateralWithdrawnEntity.amountWithdrawn = toDecimal(event.params.amountWithdrawn);
  collateralWithdrawnEntity.collateralAfter = toDecimal(event.params.collateralAfter);
  collateralWithdrawnEntity.loanId = event.params.loanID;
  collateralWithdrawnEntity.account = event.params.account;
  collateralWithdrawnEntity.timestamp = event.block.timestamp;
  collateralWithdrawnEntity.save();
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let loanRepaid = new LoanRepaid(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  loanRepaid.repaidAmount = toDecimal(event.params.repaidAmount);
  loanRepaid.newLoanAmount = toDecimal(event.params.newLoanAmount);
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
