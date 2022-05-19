/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-array-constructor */
import { assert, clearStore, test } from 'matchstick-as/assembly/index';
import { Address } from '@graphprotocol/graph-ts';
import { handleDelegateApproval, handleDelegateWithdrawApproval } from '../src/delegation';
import { DelegatedWallet } from '../generated/subgraphs/delegation/schema';
import { createDelegateApprovalEvent, createDelegateWithdrawApprovalEvent } from './delegation-test-helpers';

const defaultAuthoriser = '0xb64ff7a4a33acdf48d97dab0d764afd0f6176882';
const defaultDelegate = '0x0000000000000000000000000000000000000000';
const defaultId = `${defaultAuthoriser}-${defaultDelegate}`;

test('Handle new delegate ApproveAll delegate', () => {
  let delegateApprovalEvent = createDelegateApprovalEvent(defaultAuthoriser, defaultDelegate, 'ApproveAll');

  handleDelegateApproval(delegateApprovalEvent);
  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canMint', 'true');
  assert.fieldEquals('DelegatedWallet', defaultId, 'canExchange', 'true');
  assert.fieldEquals('DelegatedWallet', defaultId, 'canBurn', 'true');
  assert.fieldEquals('DelegatedWallet', defaultId, 'canClaim', 'true');

  clearStore();
});

test('Update delegate to ApproveAll delegate', () => {
  const existing = new DelegatedWallet(defaultId);
  existing.authoriser = Address.fromString(defaultAuthoriser);
  existing.delegate = Address.fromString(defaultDelegate);
  existing.canBurn = true;
  existing.canMint = false;
  existing.save();
  // ensure existing canMint is false
  assert.fieldEquals('DelegatedWallet', defaultId, 'canMint', 'false');

  let delegateApprovalEvent = createDelegateApprovalEvent(defaultAuthoriser, defaultDelegate, 'ApproveAll');

  handleDelegateApproval(delegateApprovalEvent);

  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canMint', 'true');
  assert.fieldEquals('DelegatedWallet', defaultId, 'canExchange', 'true');
  assert.fieldEquals('DelegatedWallet', defaultId, 'canBurn', 'true');
  assert.fieldEquals('DelegatedWallet', defaultId, 'canClaim', 'true');
  clearStore();
});
test('Handle new IssueForAddress delegate', () => {
  let delegateApprovalEvent = createDelegateApprovalEvent(defaultAuthoriser, defaultDelegate, 'IssueForAddress');

  handleDelegateApproval(delegateApprovalEvent);

  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canMint', 'true');
  // Matchstick doesn't have a way to assert undefined values :(
  // assert.fieldEquals('DelegatedWallet', defaultId, 'canClaim', 'false');

  clearStore();
});
test('Handle new BurnForAddress delegate', () => {
  let delegateApprovalEvent = createDelegateApprovalEvent(defaultAuthoriser, defaultDelegate, 'BurnForAddress');

  handleDelegateApproval(delegateApprovalEvent);

  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canBurn', 'true');
  // Matchstick doesn't have a way to assert undefined values :(
  // assert.fieldEquals('DelegatedWallet', defaultId, 'canClaim', 'false');

  clearStore();
});
test('Handle new ClaimForAddress delegate', () => {
  let delegateApprovalEvent = createDelegateApprovalEvent(defaultAuthoriser, defaultDelegate, 'ClaimForAddress');

  handleDelegateApproval(delegateApprovalEvent);

  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canClaim', 'true');
  // Matchstick doesn't have a way to assert undefined values :(
  // assert.fieldEquals('DelegatedWallet', defaultId, 'canBurn', 'false');

  clearStore();
});
test('Handle new ExchangeForAddress delegate', () => {
  let delegateApprovalEvent = createDelegateApprovalEvent(defaultAuthoriser, defaultDelegate, 'ExchangeForAddress');

  handleDelegateApproval(delegateApprovalEvent);

  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canExchange', 'true');
  // Matchstick doesn't have a way to assert undefined values :(
  // assert.fieldEquals('DelegatedWallet', defaultId, 'canBurn', 'false');

  clearStore();
});

test('Withdraw mint delegation', () => {
  const existing = new DelegatedWallet(defaultId);
  existing.authoriser = Address.fromString(defaultAuthoriser);
  existing.delegate = Address.fromString(defaultDelegate);
  existing.canBurn = true;
  existing.canMint = true;
  existing.canExchange = true;
  existing.canClaim = true;
  existing.save();
  // ensure existing canMint is true
  assert.fieldEquals('DelegatedWallet', defaultId, 'canMint', 'true');

  let delegateApprovalEvent = createDelegateWithdrawApprovalEvent(
    defaultAuthoriser,
    defaultDelegate,
    'IssueForAddress',
  );

  handleDelegateWithdrawApproval(delegateApprovalEvent);
  assert.fieldEquals('DelegatedWallet', defaultId, 'id', defaultId);
  assert.fieldEquals('DelegatedWallet', defaultId, 'authoriser', defaultAuthoriser);
  assert.fieldEquals('DelegatedWallet', defaultId, 'delegate', defaultDelegate);
  assert.fieldEquals('DelegatedWallet', defaultId, 'canMint', 'false');

  clearStore();
});

test('Withdraw before approval delegation', () => {
  let delegateApprovalEvent = createDelegateWithdrawApprovalEvent(
    defaultAuthoriser,
    defaultDelegate,
    'IssueForAddress',
  );

  handleDelegateWithdrawApproval(delegateApprovalEvent);
  assert.notInStore('DelegatedWallet', defaultId);

  clearStore();
});
