import {
  RatesUpdated as RatesUpdatedEvent,
  AggregatorAdded as AggregatorAddedEvent,
  InversePriceConfigured,
  InversePriceFrozen,
} from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/ExchangeRates';
import { AggregatorProxy } from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/AggregatorProxy';

import { AnswerUpdated as AnswerUpdatedEvent } from '../../generated/subgraphs/synthetix-rates/templates/Aggregator/Aggregator';

import { Aggregator, InverseAggregator } from '../../generated/subgraphs/synthetix-rates/templates';
import { LatestRate, InversePricingInfo } from '../../generated/subgraphs/synthetix-rates/schema';

import { BigDecimal, BigInt, DataSourceContext, dataSource, log } from '@graphprotocol/graph-ts';
import { etherUnits } from '../lib/helpers';

function addLatestRate(synth: string, rate: BigInt): void {
  let decimalRate = new BigDecimal(rate);
  addLatestRateFromDecimal(synth, decimalRate.div(etherUnits));
}

function addLatestRateFromDecimal(synth: string, rate: BigDecimal): void {
  let latestRate = new LatestRate(synth);
  latestRate.rate = rate;
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

  if (currencyKey.startsWith('s')) {
    Aggregator.createWithContext(aggregatorAddress, context);
  } else {
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

export function handleInverseConfigured(event: InversePriceConfigured): void {
  let entity = new InversePricingInfo(event.params.currencyKey.toString());
  entity.entryPoint = new BigDecimal(event.params.entryPoint);
  entity.lowerLimit = new BigDecimal(event.params.lowerLimit);
  entity.upperLimit = new BigDecimal(event.params.upperLimit);

  entity.entryPoint = entity.entryPoint.div(etherUnits);
  entity.lowerLimit = entity.lowerLimit.div(etherUnits);
  entity.upperLimit = entity.upperLimit.div(etherUnits);

  entity.frozen = false;

  entity.save();
}

export function handleInverseFrozen(event: InversePriceFrozen): void {
  let entity = new InversePricingInfo(event.params.currencyKey.toString());
  entity.frozen = true;
  entity.save();

  addLatestRate(event.params.currencyKey.toString(), event.params.rate);
}

export function handleInverseAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  let decimalRate = new BigDecimal(rate);

  // since this is inverse pricing, we have to get the latest token information and then apply it to the rate
  let inversePricingInfo = InversePricingInfo.load(context.getString('currencyKey'));

  if(inversePricingInfo == null) {
    log.warning(`Missing inverse pricing info for asset ${context.getString('currencyKey')}`, []);
    return;
  }

  if(inversePricingInfo.frozen)
    return;
  
  let inverseRate = inversePricingInfo.entryPoint.times(new BigDecimal(BigInt.fromI32(2))).minus(decimalRate.div(etherUnits));

  inverseRate = inversePricingInfo.lowerLimit.lt(inverseRate) ? inverseRate : inversePricingInfo.lowerLimit;
  inverseRate = inversePricingInfo.upperLimit.gt(inverseRate) ? inverseRate : inversePricingInfo.upperLimit;

  addLatestRateFromDecimal(context.getString('currencyKey'), inverseRate);
}
