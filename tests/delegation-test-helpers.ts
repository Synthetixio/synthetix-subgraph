/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-array-constructor */
import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, Address } from '@graphprotocol/graph-ts';
import { strToBytes } from '../src/lib/helpers';
import {
  Approval as DelegateApprovalEvent,
  WithdrawApproval as DelegateWithdrawApprovalEvent,
} from '../generated/subgraphs/delegation/delegation_DelegateApprovals_0/DelegateApprovals';

export function createDelegateApprovalEvent(
  authoriser: string,
  delegate: string,
  action: string,
): DelegateApprovalEvent {
  // @ts-ignore
  let newDelegateApprovalEvent = changetype<DelegateApprovalEvent>(newMockEvent());
  newDelegateApprovalEvent.parameters = new Array();
  let authoriserParam = new ethereum.EventParam(
    'authoriser',
    ethereum.Value.fromAddress(Address.fromString(authoriser)),
  );
  let delegateParam = new ethereum.EventParam('delegate', ethereum.Value.fromAddress(Address.fromString(delegate)));

  let actionParam = new ethereum.EventParam('action', ethereum.Value.fromBytes(strToBytes(action)));

  newDelegateApprovalEvent.parameters.push(authoriserParam);
  newDelegateApprovalEvent.parameters.push(delegateParam);
  newDelegateApprovalEvent.parameters.push(actionParam);
  return newDelegateApprovalEvent;
}
export function createDelegateWithdrawApprovalEvent(
  authoriser: string,
  delegate: string,
  action: string,
): DelegateWithdrawApprovalEvent {
  // @ts-ignore
  let newDelegateWithdrawApprovalEvent = changetype<DelegateWithdrawApprovalEvent>(newMockEvent());
  newDelegateWithdrawApprovalEvent.parameters = new Array();
  let authoriserParam = new ethereum.EventParam(
    'authoriser',
    ethereum.Value.fromAddress(Address.fromString(authoriser)),
  );
  let delegateParam = new ethereum.EventParam('delegate', ethereum.Value.fromAddress(Address.fromString(delegate)));

  let actionParam = new ethereum.EventParam('action', ethereum.Value.fromBytes(strToBytes(action)));

  newDelegateWithdrawApprovalEvent.parameters.push(authoriserParam);
  newDelegateWithdrawApprovalEvent.parameters.push(delegateParam);
  newDelegateWithdrawApprovalEvent.parameters.push(actionParam);
  return newDelegateWithdrawApprovalEvent;
}
