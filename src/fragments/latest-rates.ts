import {
  RatesUpdated as RatesUpdatedEvent,
  AggregatorAdded as AggregatorAddedEvent,
  InversePriceConfigured,
  InversePriceFrozen,
  ExchangeRates,
} from '../../generated/subgraphs/rates/ExchangeRates_13/ExchangeRates';

import {
  AggregatorProxy as AggregatorProxyContract,
  AggregatorConfirmed as AggregatorConfirmedEvent,
} from '../../generated/subgraphs/rates/ExchangeRates_13/AggregatorProxy';

import { AnswerUpdated as AnswerUpdatedEvent } from '../../generated/subgraphs/rates/templates/Aggregator/Aggregator';

import {
  AggregatorProxy,
  SynthAggregatorProxy,
  InverseAggregatorProxy,
  Aggregator,
  SynthAggregator,
  InverseAggregator,
} from '../../generated/subgraphs/rates/templates';
import { LatestRate, InversePricingInfo } from '../../generated/subgraphs/rates/schema';

import {
  BigDecimal,
  BigInt,
  DataSourceContext,
  dataSource,
  log,
  Address,
  ethereum,
  Bytes,
} from '@graphprotocol/graph-ts';
import { etherUnits, strToBytes, toDecimal } from '../lib/helpers';
import { ProxyERC20 } from '../../generated/subgraphs/rates/ChainlinkMultisig/ProxyERC20';
import { Synthetix } from '../../generated/subgraphs/rates/ChainlinkMultisig/Synthetix';
import { ExecutionSuccess } from '../../generated/subgraphs/rates/ChainlinkMultisig/GnosisSafe';
import { AddressResolver } from '../../generated/subgraphs/rates/ChainlinkMultisig/AddressResolver';
import { ZERO_ADDRESS } from '../lib/util';

export function addLatestRate(synth: string, rate: BigInt, aggregator: Address): void {
  let decimalRate = new BigDecimal(rate);
  addLatestRateFromDecimal(synth, decimalRate.div(etherUnits), aggregator);
}

export function addLatestRateFromDecimal(synth: string, rate: BigDecimal, aggregator: Address): void {
  let prevLatestRate = LatestRate.load(synth);
  if (prevLatestRate != null && aggregator.notEqual(prevLatestRate.aggregator)) return;

  if (prevLatestRate == null) {
    prevLatestRate = new LatestRate(synth);
    prevLatestRate.aggregator = aggregator;
  }

  prevLatestRate.rate = rate;
  prevLatestRate.save();
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
    } else if (currencyKey.startsWith('i')) {
      InverseAggregatorProxy.createWithContext(aggregatorProxyAddress, context);
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
  } else if (currencyKey.startsWith('i')) {
    InverseAggregator.createWithContext(aggregatorAddress, context);
  } else {
    Aggregator.createWithContext(aggregatorAddress, context);
  }
}

export function calculateInverseRate(currencyKey: string, beforeRate: BigDecimal): BigDecimal | null {
  // since this is inverse pricing, we have to get the latest token information and then apply it to the rate
  let inversePricingInfo = InversePricingInfo.load(currencyKey);

  if (inversePricingInfo == null) {
    log.warning(`Missing inverse pricing info for asset {}`, [currencyKey]);
    return null;
  }

  if (inversePricingInfo.frozen) return null;

  let inverseRate = inversePricingInfo.entryPoint.times(new BigDecimal(BigInt.fromI32(2))).minus(beforeRate);

  inverseRate = inversePricingInfo.lowerLimit.lt(inverseRate) ? inverseRate : inversePricingInfo.lowerLimit;
  inverseRate = inversePricingInfo.upperLimit.gt(inverseRate) ? inverseRate : inversePricingInfo.upperLimit;

  return inverseRate;
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
      addLatestRate(keys[i].toString(), rates[i], ZERO_ADDRESS);
    }
  }
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

  let curInverseRate = LatestRate.load(event.params.currencyKey.toString());

  if (!curInverseRate) return;

  addLatestRate(event.params.currencyKey.toString(), event.params.rate, curInverseRate.aggregator as Address);
}

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  addDollar('sUSD');
  addLatestRate(context.getString('currencyKey'), rate, event.address);
}

export function handleInverseAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  let inverseRate = calculateInverseRate(context.getString('currencyKey'), toDecimal(rate));

  if (inverseRate == null) return;

  addLatestRateFromDecimal(context.getString('currencyKey'), inverseRate as BigDecimal, event.address);
}

// required to rescan all aggregator addresses whenever chainlink settings are updated. This is because of an issue where the chainlink aggregator proxy
// does not contain an event to track when the aggregator addresses are updated, which means we must scan them manually when it makes sense to do so
export function handleChainlinkUpdate(event: ExecutionSuccess): void {
  let synthetixProxyContract = ProxyERC20.bind(
    Address.fromHexString('0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f') as Address,
  );
  let synthetixAddress = synthetixProxyContract.try_target();

  if (synthetixAddress.reverted) {
    log.warning('snx base contract not available', []);
    return;
  }

  let synthetixContract = Synthetix.bind(synthetixAddress.value);

  let resolverAddress = synthetixContract.try_resolver();

  if (resolverAddress.reverted) {
    log.warning('snx resolver not available', []);
    return;
  }

  let resolverContract = AddressResolver.bind(resolverAddress.value);
  let ratesAddress = resolverContract.try_getAddress(strToBytes('ExchangeRates'));

  if (ratesAddress.reverted) {
    log.warning('could not get exchangerates address from resolver', []);
    return;
  }

  let ratesContract = ExchangeRates.bind(ratesAddress.value);

  let aggregatorKey: ethereum.CallResult<Bytes>;
  let index = 0;
  do {
    aggregatorKey = ratesContract.try_aggregatorKeys(BigInt.fromI32(index++));

    if (!aggregatorKey.reverted) {
      let aggregatorAddress = ratesContract.try_aggregators(aggregatorKey.value);

      if (!aggregatorAddress.reverted) {
        addProxyAggregator(aggregatorKey.value.toString(), aggregatorAddress.value);
      }
    }
  } while (!aggregatorKey.reverted);

  if (index == 0) {
    log.warning('no aggregator keys found in rates contract for chainlink update, or reverted', []);
  }
}
