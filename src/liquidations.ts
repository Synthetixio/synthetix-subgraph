import { Synthetix32 } from '../generated/subgraphs/synthetix-liquidations/Liquidations_0/Synthetix32';

import { AddressResolver } from '../generated/subgraphs/synthetix-liquidations/Liquidations_0/AddressResolver';

import {
  AccountFlaggedForLiquidation as AccountFlaggedForLiquidationEvent,
  AccountRemovedFromLiquidation as AccountRemovedFromLiquidationEvent,
  Liquidations,
} from '../generated/subgraphs/synthetix-liquidations/Liquidations_0/Liquidations';

import { AccountLiquidated as AccountLiquidatedEvent } from '../generated/subgraphs/synthetix-liquidations/Synthetix_0/Synthetix';

import { AccountFlaggedForLiquidation, AccountRemovedFromLiquidation, AccountLiquidated } from '../generated/subgraphs/synthetix-liquidations/schema';

import { strToBytes } from './lib/util';

export function handleAccountFlaggedForLiquidation(event: AccountFlaggedForLiquidationEvent): void {
  let liquidationsContract = Liquidations.bind(event.address);
  let resolver = AddressResolver.bind(liquidationsContract.resolver());
  let synthetix = Synthetix32.bind(resolver.getAddress(strToBytes('Synthetix', 32)));
  let accountFlaggedForLiquidation = new AccountFlaggedForLiquidation(
    event.params.deadline.toString() + '-' + event.params.account.toHex(),
  );
  accountFlaggedForLiquidation.account = event.params.account;
  accountFlaggedForLiquidation.deadline = event.params.deadline;
  accountFlaggedForLiquidation.collateralRatio = synthetix.collateralisationRatio(event.params.account);
  accountFlaggedForLiquidation.collateral = synthetix.collateral(event.params.account);
  accountFlaggedForLiquidation.liquidatableNonEscrowSNX = synthetix.balanceOf(event.params.account);
  accountFlaggedForLiquidation.save();
}

export function handleAccountRemovedFromLiquidation(event: AccountRemovedFromLiquidationEvent): void {
  let accountRemovedFromLiquidation = new AccountRemovedFromLiquidation(
    event.params.time.toString() + '-' + event.params.account.toHex(),
  );
  accountRemovedFromLiquidation.account = event.params.account;
  accountRemovedFromLiquidation.time = event.params.time;
  accountRemovedFromLiquidation.save();
}

export function handleAccountLiquidated(event: AccountLiquidatedEvent): void {
  let entity = new AccountLiquidated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.account;
  entity.snxRedeemed = event.params.snxRedeemed;
  entity.amountLiquidated = event.params.amountLiquidated;
  entity.liquidator = event.params.liquidator;
  entity.time = event.block.timestamp;

  entity.save();
}