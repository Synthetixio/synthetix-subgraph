import {
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
} from '../generated/EtherCollateral/EtherCollateral';

import { Loan, LoanCreated, LoanClosed } from '../generated/schema';

export function handleLoanCreated(event: LoanCreatedEvent): void {
  let loanEntity = new Loan(event.params.loanID.toHex());
  let loanCreatedEntity = new LoanCreated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  loanEntity.account = event.params.account;
  loanEntity.amount = event.params.amount;
  loanEntity.isOpen = true;
  loanEntity.save();

  loanCreatedEntity.account = event.params.account;
  loanCreatedEntity.amount = event.params.amount;
  loanCreatedEntity.loanId = event.params.loanID;
  loanCreatedEntity.save();
}

export function handleLoanClosed(event: LoanClosedEvent): void {
  let loanEntity = Loan.load(event.params.loanID.toHex());
  let loanClosedEntity = new LoanClosed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  loanEntity.isOpen = false;
  loanEntity.save();

  loanClosedEntity.account = event.params.account;
  loanClosedEntity.loanId = event.params.loanID;
  loanClosedEntity.feesPaid = event.params.feesPaid;
  loanClosedEntity.save();
}
