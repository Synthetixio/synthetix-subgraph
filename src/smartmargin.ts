import { Address } from '@graphprotocol/graph-ts';
import { NewAccount as NewAccountEvent } from '../generated/subgraphs/perps/smartmargin_factory/Factory';
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from '../generated/subgraphs/perps/smartmargin_events/Events';
import { SmartMarginAccount, SmartMarginAccountTransfer } from '../generated/subgraphs/perps/schema';

export function handleNewAccount(event: NewAccountEvent): void {
  // create a new entity to store the cross-margin account owner
  const smAccountAddress = event.params.account as Address;
  let smartMarginAccount = SmartMarginAccount.load(smAccountAddress.toHex());

  if (smartMarginAccount == null) {
    smartMarginAccount = new SmartMarginAccount(smAccountAddress.toHex());
    smartMarginAccount.owner = event.params.creator;
    smartMarginAccount.version = event.params.version;
    smartMarginAccount.save();
  }
}

export function handleDeposit(event: DepositEvent): void {
  // get the user smart margin account
  const userAccount = event.params.user;
  const smartMarginAccount = event.params.account;

  let smartMarginTransfer = new SmartMarginAccountTransfer(
    smartMarginAccount.toHex() + '-' + event.transaction.hash.toHex(),
  );

  smartMarginTransfer.account = userAccount;
  smartMarginTransfer.abstractAccount = smartMarginAccount;
  smartMarginTransfer.timestamp = event.block.timestamp;
  smartMarginTransfer.size = event.params.amount;
  smartMarginTransfer.txHash = event.transaction.hash.toHex();
  smartMarginTransfer.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  // get the user smart margin account
  const userAccount = event.params.user;
  const smartMarginAccount = event.params.account;

  let smartMarginTransfer = new SmartMarginAccountTransfer(
    smartMarginAccount.toHex() + '-' + event.transaction.hash.toHex(),
  );

  smartMarginTransfer.account = userAccount;
  smartMarginTransfer.abstractAccount = smartMarginAccount;
  smartMarginTransfer.timestamp = event.block.timestamp;
  smartMarginTransfer.size = event.params.amount.neg();
  smartMarginTransfer.txHash = event.transaction.hash.toHex();
  smartMarginTransfer.save();
}
