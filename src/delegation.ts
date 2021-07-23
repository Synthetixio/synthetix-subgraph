import {
  Approval as DelegateApprovalEvent,
  WithdrawApproval as DelegateWithdrawApprovalEvent,
} from '../generated/subgraphs/delegation/delegation_DelegateApprovals_0/DelegateApprovals';

import { DelegatedWallet } from '../generated/subgraphs/delegation/schema';

import { strToBytes } from './lib/util';
import { Address, Bytes } from '@graphprotocol/graph-ts';

function setDelegateApproval(authoriser: Address, delegate: Address, action: Bytes, isApproval: boolean): void {
  let delegatedWalletEntity = DelegatedWallet.load(authoriser.toHex() + '-' + delegate.toHex());
  let actionRight = isApproval ? true : false;
  if (delegatedWalletEntity == null) {
    if (!isApproval) {
      return;
    }
    delegatedWalletEntity = new DelegatedWallet(authoriser.toHex() + '-' + delegate.toHex());
    delegatedWalletEntity.authoriser = authoriser;
    delegatedWalletEntity.delegate = delegate;
  }

  if (action == strToBytes('ApproveAll')) {
    delegatedWalletEntity.canMint = actionRight;
    delegatedWalletEntity.canBurn = actionRight;
    delegatedWalletEntity.canClaim = actionRight;
    delegatedWalletEntity.canExchange = actionRight;
  } else if (action == strToBytes('IssueForAddress')) {
    delegatedWalletEntity.canMint = actionRight;
  } else if (action == strToBytes('BurnForAddress')) {
    delegatedWalletEntity.canBurn = actionRight;
  } else if (action == strToBytes('ClaimForAddress')) {
    delegatedWalletEntity.canClaim = actionRight;
  } else if (action == strToBytes('ExchangeForAddress')) {
    delegatedWalletEntity.canExchange = actionRight;
  } else return;

  delegatedWalletEntity.save();
}

export function handleDelegateApproval(event: DelegateApprovalEvent): void {
  let authoriser = event.params.authoriser;
  let delegate = event.params.delegate;
  let action = event.params.action;
  setDelegateApproval(authoriser, delegate, action, true);
}

export function handleDelegateWithdrawApproval(event: DelegateWithdrawApprovalEvent): void {
  let authoriser = event.params.authoriser;
  let delegate = event.params.delegate;
  let action = event.params.action;
  setDelegateApproval(authoriser, delegate, action, false);
}
