import { RatesUpdated as RatesUpdatedEvent, AggregatorAdded as AggregatorAddedEvent } from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/ExchangeRates';
import { AggregatorProxy } from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/AggregatorProxy';


import { AnswerUpdated as AnswerUpdatedEvent } from '../../generated/subgraphs/synthetix-rates/templates/Aggregator/Aggregator';

import { Aggregator, InverseAggregator } from '../../generated/subgraphs/synthetix-rates/templates';
import { LatestRate } from '../../generated/subgraphs/synthetix-rates/schema';

import { BigDecimal, BigInt, DataSourceContext, dataSource } from '@graphprotocol/graph-ts';
import { etherUnits } from '../lib/helpers';

function addLatestRate(synth: string, rate: BigInt): void {
  let latestRate = new LatestRate(synth);
  let decimalRate = new BigDecimal(rate);
  latestRate.rate = decimalRate.div(etherUnits);
  latestRate.save();
}

function addDollar(dollarID: string): void {
  let dollarRate = new LatestRate(dollarID);
  dollarRate.rate = new BigDecimal(BigInt.fromI32(1));
  dollarRate.save();
}

export function handleAggregatorAdded(event: AggregatorAddedEvent): void {
  let context = new DataSourceContext();

  // check to see if the aggregator given is actually a proxy
  let possibleProxy = AggregatorProxy.bind(event.params.aggregator);
  let tryAggregator = possibleProxy.try_aggregator();
  let aggregatorAddress = !tryAggregator.reverted ? tryAggregator.value : event.params.aggregator;
  let currencyKey = event.params.currencyKey.toString();

  context.setString('currencyKey', currencyKey);

  if(currencyKey.startsWith('s')) {
    Aggregator.createWithContext(aggregatorAddress, context);
  }
  else {
    InverseAggregator.createWithContext(aggregatorAddress, context);
  }

}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar('sUSD');
  addDollar('nUSD');

  let keys = event.params.currencyKeys;
  let rates = event.params.newRates;

  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() != '') {
      addLatestRate(keys[i].toString(), rates[i]);
    }
  }
}

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  addDollar('sUSD');
  addLatestRate(context.getString('currencyKey'), rate);
}

export function handleInverseAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  addDollar('sUSD');
  addLatestRate(context.getString('currencyKey'), rate);
}