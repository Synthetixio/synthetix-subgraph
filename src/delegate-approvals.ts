import {
  Approval,
  WithdrawApproval,
  EternalStorageUpdated,
  OwnerNominated,
  OwnerChanged,
} from '../generated/DelegateApprovals/DelegateApprovals';
import { DelegateApproval } from '../generated/schema';

export function handleApproval(event: Approval): void {
  let id = event.params.authoriser.toHex() + '-' + event.params.delegate.toHex() + '-' + event.params.action.toHex();
  let entity = DelegateApproval.load(id);
  if (entity == null) {
    entity = new DelegateApproval(id);
    entity.authoriser = event.params.authoriser;
    entity.delegate = event.params.delegate;
    entity.action = event.params.action;
  }
  entity.withdrawn = false;
  entity.save();
}

export function handleWithdrawApproval(event: WithdrawApproval): void {
  let id = event.params.authoriser.toHex() + '-' + event.params.delegate.toHex() + '-' + event.params.action.toHex();
  let entity = DelegateApproval.load(id);
  if (entity != null) {
    entity.withdrawn = true;
    entity.save();
  }
}

export function handleEternalStorageUpdated(event: EternalStorageUpdated): void {}

export function handleOwnerNominated(event: OwnerNominated): void {}

export function handleOwnerChanged(event: OwnerChanged): void {}
