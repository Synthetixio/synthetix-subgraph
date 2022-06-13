import {
  RatesUpdated as RatesUpdatedEvent,
  AggregatorAdded as AggregatorAddedEvent,
} from '../../generated/subgraphs/latest-rates/ExchangeRates_13/ExchangeRates';

import {
  AggregatorProxy as AggregatorProxyContract,
  AggregatorConfirmed as AggregatorConfirmedEvent,
} from '../../generated/subgraphs/latest-rates/ExchangeRates_13/AggregatorProxy';

import { AnswerUpdated as AnswerUpdatedEvent } from '../../generated/subgraphs/latest-rates/templates/Aggregator/Aggregator';

import {
  AggregatorProxy,
  SynthAggregatorProxy,
  Aggregator,
  SynthAggregator,
} from '../../generated/subgraphs/latest-rates/templates';
import { LatestRate, RateUpdate, Candle } from '../../generated/subgraphs/latest-rates/schema';

import { BigDecimal, BigInt, DataSourceContext, dataSource, log, Address, ethereum } from '@graphprotocol/graph-ts';

import { strToBytes, toDecimal, ZERO, ZERO_ADDRESS, CANDLE_PERIODS } from '../lib/helpers';
import { getContractDeployment } from '../../generated/addresses';
import { AddressResolver } from '../../generated/subgraphs/exchanges/exchanges_Synthetix_0/AddressResolver';
import { ExchangeRates } from '../../generated/subgraphs/latest-rates/ExchangeRates_0/ExchangeRates';

export function initFeed(currencyKey: string): BigDecimal | null {
  let addressResolverAddress = getContractDeployment(
    'AddressResolver',
    dataSource.network(),
    BigInt.fromI32(1000000000),
  )!;
  let resolver = AddressResolver.bind(addressResolverAddress);
  let exchangeRateAddressTry = resolver.try_getAddress(strToBytes('ExchangeRates', 32));

  if (!exchangeRateAddressTry.reverted) {
    let er = ExchangeRates.bind(exchangeRateAddressTry.value);

    let aggregatorAddress = er.try_aggregators(strToBytes(currencyKey, 32));

    if (!aggregatorAddress.reverted) {
      addProxyAggregator(currencyKey, aggregatorAddress.value);

      let r = er.try_rateForCurrency(strToBytes(currencyKey, 32));

      if (!r.reverted) {
        return toDecimal(r.value);
      }
    }
  }

  return null;
}

export function addLatestRate(synth: string, rate: BigInt, aggregator: Address, event: ethereum.Event): void {
  let decimalRate = toDecimal(rate);
  addLatestRateFromDecimal(synth, decimalRate, aggregator, event);
}

export function addLatestRateFromDecimal(
  synth: string,
  rate: BigDecimal,
  aggregator: Address,
  event: ethereum.Event,
): void {
  let prevLatestRate = LatestRate.load(synth);
  if (prevLatestRate != null && aggregator.notEqual(prevLatestRate.aggregator)) return;

  if (prevLatestRate == null) {
    prevLatestRate = new LatestRate(synth);
    prevLatestRate.aggregator = aggregator;
    prevLatestRate.timestamp = event.block.timestamp;
  }

  // create the rate update entity
  let rateUpdate = new RateUpdate(event.transaction.hash.toHex() + '-' + synth);
  rateUpdate.currencyKey = strToBytes(synth);
  rateUpdate.synth = synth;
  rateUpdate.rate = rate;
  rateUpdate.block = event.block.number;
  rateUpdate.timestamp = event.block.timestamp;
  rateUpdate.save();

  // update the candle entities
  updateCandle(event.block.timestamp, prevLatestRate.timestamp, synth, rate);

  // finally update the latest rate entity
  prevLatestRate.rate = rate;
  prevLatestRate.timestamp = event.block.timestamp;
  prevLatestRate.save();
}

function updateCandle(timestamp: BigInt, lastUpdateTimestamp: BigInt, synth: string, rate: BigDecimal): void {
  for (let p = 0; p < CANDLE_PERIODS.length; p++) {
    let period = CANDLE_PERIODS[p];
    let periodId = timestamp.div(period);

    let id = synth + '-' + period.toString() + '-' + periodId.toString();

    let lastPeriodId = periodId.minus(BigInt.fromI32(1));
    let lastId = synth + '-' + period.toString() + '-' + lastPeriodId.toString();

    let candle = Candle.load(id);
    let lastCandle = Candle.load(lastId);

    if (lastCandle == null && lastUpdateTimestamp !== null && lastUpdateTimestamp !== timestamp) {
      // get the candle from the last rate update
      let prevPeriodId = lastUpdateTimestamp.div(period);
      let prevId = synth + '-' + period.toString() + '-' + prevPeriodId.toString();
      let prevCandle = Candle.load(prevId);

      // make new candles between that update and now
      for (
        let newPeriodId = prevPeriodId.plus(BigInt.fromI32(1));
        newPeriodId.le(lastPeriodId);
        newPeriodId = newPeriodId.plus(BigInt.fromI32(1))
      ) {
        // create the new candle
        if (prevCandle) {
          let newId = synth + '-' + period.toString() + '-' + newPeriodId.toString();
          let newCandle = new Candle(newId);
          newCandle.synth = synth;
          newCandle.high = prevCandle.close;
          newCandle.low = prevCandle.close;
          newCandle.close = prevCandle.close;
          newCandle.average = prevCandle.close;
          newCandle.period = period;
          newCandle.timestamp = newPeriodId.times(period); // store the beginning of this period, rather than the timestamp of the first rate update.
          newCandle.aggregatedPrices = BigInt.fromI32(0);

          newCandle.open = prevCandle.close;
          newCandle.save();

          // set previous candle to this one
          prevCandle = newCandle;
        }
      }

      // now reset the last candle
      lastCandle = Candle.load(lastId);
    }

    if (candle == null) {
      candle = new Candle(id);
      candle.synth = synth;
      candle.high = rate;
      candle.low = rate;
      candle.close = rate;
      candle.average = rate;
      candle.period = period;
      candle.timestamp = timestamp.minus(timestamp.mod(period)); // store the beginning of this period, rather than the timestamp of the first rate update.
      candle.aggregatedPrices = BigInt.fromI32(1);

      if (lastCandle !== null) {
        candle.open = lastCandle.close;
        if (lastCandle.close < candle.low) {
          candle.low = lastCandle.close;
        }
        if (lastCandle.close > candle.high) {
          candle.high = lastCandle.close;
        }
      } else {
        candle.open = rate;
      }

      candle.save();
    }

    if (candle.low > rate) {
      candle.low = rate;
    }
    if (candle.high < rate) {
      candle.high = rate;
    }
    candle.close = rate;
    candle.average = calculateAveragePrice(candle.average, rate, candle.aggregatedPrices);
    candle.aggregatedPrices = candle.aggregatedPrices.plus(BigInt.fromI32(1));

    candle.save();
  }
}

function calculateAveragePrice(
  oldAveragePrice: BigDecimal,
  newRate: BigDecimal,
  oldAggregatedPrices: BigInt,
): BigDecimal {
  return oldAveragePrice
    .times(oldAggregatedPrices.toBigDecimal())
    .plus(newRate)
    .div(oldAggregatedPrices.plus(BigInt.fromI32(1)).toBigDecimal());
}

export function addDollar(dollarID: string): void {
  let dollarRate = new LatestRate(dollarID);
  dollarRate.rate = new BigDecimal(BigInt.fromI32(1));
  dollarRate.aggregator = ZERO_ADDRESS;
  dollarRate.save();
}

export function addProxyAggregator(currencyKey: string, aggregatorProxyAddress: Address): void {
  let proxy = AggregatorProxyContract.bind(aggregatorProxyAddress);
  let underlyingAggregator = proxy.try_aggregator();

  if (!underlyingAggregator.reverted) {
    let context = new DataSourceContext();
    context.setString('currencyKey', currencyKey);

    log.info('adding proxy aggregator for synth {}', [currencyKey]);

    if (currencyKey.startsWith('s')) {
      SynthAggregatorProxy.createWithContext(aggregatorProxyAddress, context);
    } else {
      AggregatorProxy.createWithContext(aggregatorProxyAddress, context);
    }

    addAggregator(currencyKey, underlyingAggregator.value);
  } else {
    addAggregator(currencyKey, aggregatorProxyAddress);
  }
}

export function addAggregator(currencyKey: string, aggregatorAddress: Address): void {
  // check current aggregator address, and don't add again if its same
  let latestRate = LatestRate.load(currencyKey);

  log.info('adding aggregator for synth {}', [currencyKey]);

  if (latestRate != null) {
    if (aggregatorAddress.equals(latestRate.aggregator)) {
      return;
    }

    latestRate.aggregator = aggregatorAddress;
    latestRate.save();
  }

  let context = new DataSourceContext();
  context.setString('currencyKey', currencyKey);

  if (currencyKey.startsWith('s')) {
    SynthAggregator.createWithContext(aggregatorAddress, context);
  } else {
    Aggregator.createWithContext(aggregatorAddress, context);
  }
}

export function handleAggregatorAdded(event: AggregatorAddedEvent): void {
  addProxyAggregator(event.params.currencyKey.toString(), event.params.aggregator);
}

export function handleAggregatorProxyAddressUpdated(event: AggregatorConfirmedEvent): void {
  let context = dataSource.context();
  addAggregator(context.getString('currencyKey'), event.params.latest);
}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar('sUSD');
  addDollar('nUSD');

  let keys = event.params.currencyKeys;
  let rates = event.params.newRates;

  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() != '') {
      addLatestRate(keys[i].toString(), rates[i], ZERO_ADDRESS, event);
    }
  }
}

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  addDollar('sUSD');
  addLatestRate(context.getString('currencyKey'), rate, event.address, event);
}
