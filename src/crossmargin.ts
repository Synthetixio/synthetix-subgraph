import { Address } from '@graphprotocol/graph-ts';
import { NewAccount as NewAccountEvent } from '../generated/subgraphs/futures/crossmargin_factory/MarginAccountFactory';
import { CrossMarginAccount } from '../generated/subgraphs/futures/schema';

export function handleNewAccount(event: NewAccountEvent): void {
  // create a new entity to store the cross-margin account owner
  const cmAccountAddress = event.params.account as Address;
  let crossMarginAccount = CrossMarginAccount.load(cmAccountAddress.toHex());

  if (crossMarginAccount == null) {
    crossMarginAccount = new CrossMarginAccount(cmAccountAddress.toHex());
    crossMarginAccount.owner = event.params.owner;
    crossMarginAccount.save();
  }
}
