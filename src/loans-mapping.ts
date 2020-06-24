import {
  LoanCreated as LoanCreatedEvent,
  LoanClosed as LoanClosedEvent,
} from '../generated/EtherCollateral/EtherCollateral';

import { Loan, LoanCreated, LoanClosed } from '../generated/schema';

export function handleLoanCreated(event: LoanCreatedEvent): void {
  let loanId = event.params.loanID;
  let loanEntity = new Loan(loanId.toHex());
  let loanCreatedEntity = new LoanCreated(loanId.toHex());

  loanEntity.acount = event.params.account;
  loanEntity.amount = event.params.amount;
  loanEntity.isOpen = true;
  loanEntity.save();

  loanCreatedEntity.account = event.params.account;
  loanCreatedEntity.amount = event.params.amount;
  loanCreatedEntity.save();
}

export function handleLoanClosed(event: LoanClosedEvent): void {
  let loanId = event.params.loanID;
  let loanEntity = Loan.load(loanId.toHex());
  let loanClosedEntity = new LoanClosed(loanId.toHex());

  loanEntity.isOpen = false;
  loanEntity.save();

  loanClosedEntity.account = event.params.account;
  loanClosedEntity.feesPaid = event.params.feesPaid;
  loanClosedEntity.save();
}
