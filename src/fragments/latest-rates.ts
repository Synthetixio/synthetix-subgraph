import { RatesUpdated as RatesUpdatedEvent, AggregatorAdded as AggregatorAddedEvent } from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/ExchangeRates';

import { AnswerUpdated as AnswerUpdatedEvent } from '../../generated/subgraphs/synthetix-rates/templates/Aggregator/Aggregator';

import { Aggregator } from '../../generated/subgraphs/synthetix-rates/templates';
import { LatestRate } from '../../generated/subgraphs/synthetix-rates/schema';

import { BigDecimal, BigInt, DataSourceContext, dataSource } from '@graphprotocol/graph-ts';
import { etherUnits } from '../lib/helpers';

function addLatestRate(synth: string, rate: BigInt): void {
  let latestRate = new LatestRate(synth);
  let decimalRate = new BigDecimal(rate)
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

  // note: even if there is more than one currency key associated with an aggregator, the 
  context.setString('currencyKey', event.params.currencyKey.toString());
  Aggregator.createWithContext(event.params.aggregator, context);
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