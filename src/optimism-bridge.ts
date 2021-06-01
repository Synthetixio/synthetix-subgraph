import { DepositInitiated as DepositInitiatedEvent } from '../generated/subgraphs/optimism-bridge/SynthetixBridgeToOptimism/OptimismBridge';

import { DepositInitiated } from '../generated/schema';

export function handleDepositInitiated(event: DepositInitiatedEvent): void {
  let depositInitiatedEntity = new DepositInitiated(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  depositInitiatedEntity.toAddress = event.params._to;
  depositInitiatedEntity.fromAddress = event.params._from;
  depositInitiatedEntity.amount = event.params._amount;
  depositInitiatedEntity.timestamp = event.block.timestamp;
  depositInitiatedEntity.block = event.block.number;
  depositInitiatedEntity.save();
}
