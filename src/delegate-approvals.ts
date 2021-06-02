import { log } from '@graphprotocol/graph-ts';
import {
  Approval,
  WithdrawApproval,
  EternalStorageUpdated,
  OwnerNominated,
  OwnerChanged,
} from '../generated/DelegateApprovals/DelegateApprovals';
import { Account } from '../generated/schema';

let ALL_ACTION = 'ApproveAll';
let BURN_ACTION = 'BurnForAddress';
let MINT_ACTION = 'IssueForAddress';
let CLAIM_ACTION = 'ClaimForAddress';
let TRADE_ACTION = 'ExchangeForAddress';

export function handleApproval(event: Approval): void {
  let authoriser = event.params.authoriser;
  let delegate = event.params.delegate;
  let action = event.params.action.toString();

  log.warning('approve: {}', [action]);

  let id = authoriser.toHex() + '-' + delegate.toHex();
  let entity = Account.load(id);
  if (entity == null) {
    entity = new Account(id);
    entity.authoriser = authoriser;
    entity.delegate = delegate;
    entity.burn = false;
    entity.mint = false;
    entity.claim = false;
    entity.exchange = false;
  }
  if (action == ALL_ACTION) {
    entity.burn = true;
    entity.mint = true;
    entity.claim = true;
    entity.exchange = true;
  } else if (action == BURN_ACTION) {
    entity.burn = true;
  } else if (action == MINT_ACTION) {
    entity.mint = true;
  } else if (action == CLAIM_ACTION) {
    entity.claim = true;
  } else if (action == TRADE_ACTION) {
    entity.exchange = true;
  }
  entity.save();
}

export function handleWithdrawApproval(event: WithdrawApproval): void {
  let authoriser = event.params.authoriser;
  let delegate = event.params.delegate;
  let action = event.params.action.toString();

  log.warning('withdraw: {}', [action]);

  let id = authoriser.toHex() + '-' + delegate.toHex();
  let entity = Account.load(id);
  if (entity != null) {
    if (action == ALL_ACTION) {
      entity.burn = false;
      entity.mint = false;
      entity.claim = false;
      entity.exchange = false;
    } else if (action == BURN_ACTION) {
      entity.burn = false;
    } else if (action == MINT_ACTION) {
      entity.mint = false;
    } else if (action == CLAIM_ACTION) {
      entity.claim = false;
    } else if (action == TRADE_ACTION) {
      entity.exchange = false;
    }
    entity.save();
  }
}

export function handleEternalStorageUpdated(event: EternalStorageUpdated): void {}

export function handleOwnerNominated(event: OwnerNominated): void {}

export function handleOwnerChanged(event: OwnerChanged): void {}
