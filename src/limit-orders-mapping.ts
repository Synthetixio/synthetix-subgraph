import {
  Order as OrderEvent,
  Cancel as CancelEvent,
  Execute as ExecuteEvent,
} from '../generated/LimitOrders/LimitOrders';

import { LimitOrder } from '../generated/schema';

export function handleNewOrder(event: OrderEvent): void {
  let orderEntity = new LimitOrder(event.params.orderID.toHex());
  orderEntity.timestamp = event.block.timestamp;
  orderEntity.submitter = event.params.submitter;
  orderEntity.sourceCurrencyKey = event.params.sourceCurrencyKey;
  orderEntity.destinationCurrencyKey = event.params.destinationCurrencyKey;
  orderEntity.minDestinationAmount = event.params.minDestinationAmount;
  orderEntity.executionFee = event.params.executionFee;
  orderEntity.deposit = event.params.weiDeposit;
  orderEntity.status = 'pending';

  orderEntity.save();
}

export function handleOrderCancellation(event: CancelEvent): void {
  let orderEntity = LimitOrder.load(event.params.orderID.toHex());
  orderEntity.status = 'cancelled';

  orderEntity.save();
}

export function handleOrderExecution(event: ExecuteEvent): void {
  let orderEntity = LimitOrder.load(event.params.orderID.toHex());
  orderEntity.status = 'filled';

  orderEntity.save();
}
