import {
  RatesUpdated as RatesUpdatedEvent,
  AggregatorAdded as AggregatorAddedEvent,
  InversePriceConfigured,
  InversePriceFrozen,
  ExchangeRates,
} from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/ExchangeRates';
import { AggregatorProxy } from '../../generated/subgraphs/synthetix-rates/ExchangeRates_13/AggregatorProxy';

import { AnswerUpdated as AnswerUpdatedEvent } from '../../generated/subgraphs/synthetix-rates/templates/Aggregator/Aggregator';

import { Aggregator, InverseAggregator } from '../../generated/subgraphs/synthetix-rates/templates';
import { LatestRate, InversePricingInfo } from '../../generated/subgraphs/synthetix-rates/schema';

import { BigDecimal, BigInt, DataSourceContext, dataSource, log, Address, ethereum, Bytes } from '@graphprotocol/graph-ts';
import { etherUnits, strToBytes } from '../lib/helpers';
import { ProxyERC20 } from '../../generated/subgraphs/synthetix-rates/ChainlinkMultisig/ProxyERC20';
import { Synthetix } from '../../generated/subgraphs/synthetix-rates/ChainlinkMultisig/Synthetix';
import { AddressResolver } from '../../generated/subgraphs/synthetix-rates/ChainlinkMultisig/AddressResolver';

function addLatestRate(synth: string, rate: BigInt, version: BigInt): void {
  let decimalRate = new BigDecimal(rate);
  addLatestRateFromDecimal(synth, decimalRate.div(etherUnits), version);
}

function addLatestRateFromDecimal(synth: string, rate: BigDecimal, version: BigInt): void {
  let prevLatestRate = LatestRate.load(synth);
  if(prevLatestRate != null && prevLatestRate.version.gt(version))
    return;

  let latestRate = new LatestRate(synth);
  latestRate.rate = rate;
  latestRate.version = version;
  latestRate.save();
}

function addDollar(dollarID: string): void {
  let dollarRate = new LatestRate(dollarID);
  dollarRate.rate = new BigDecimal(BigInt.fromI32(1));
  dollarRate.version = BigInt.fromI32(1);
  dollarRate.save();
}

function addAggregator(currencyKey: string, aggregatorAddress: Address, version: BigInt): void {
  // check to see if the aggregator given is actually a proxy
  let possibleProxy = AggregatorProxy.bind(aggregatorAddress);
  let tryAggregator = possibleProxy.try_aggregator();
  let trueAggregatorAddress = !tryAggregator.reverted ? tryAggregator.value : aggregatorAddress;

  let context = new DataSourceContext();
  context.setString('currencyKey', currencyKey);
  context.setBigInt('version', version)

  if (currencyKey.startsWith('s')) {
    Aggregator.createWithContext(trueAggregatorAddress, context);
  } else {
    InverseAggregator.createWithContext(trueAggregatorAddress, context);
  }
}

export function handleAggregatorAdded(event: AggregatorAddedEvent): void {
  addAggregator(event.params.currencyKey.toString(), event.params.aggregator, event.block.number);
}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar('sUSD');
  addDollar('nUSD');

  let keys = event.params.currencyKeys;
  let rates = event.params.newRates;

  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() != '') {
      addLatestRate(keys[i].toString(), rates[i], BigInt.fromI32(0));
    }
  }
}

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  let context = dataSource.context();
  let rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  addDollar('sUSD');
  addLatestRate(context.getString('currencyKey'), rate, context.getBigInt('version'));
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
  
  if(!curInverseRate)
    return;

  addLatestRate(event.params.currencyKey.toString(), event.params.rate, curInverseRate.version);
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

  addLatestRateFromDecimal(context.getString('currencyKey'), inverseRate, context.getBigInt('version'));
}

// hack function for mainnet contract stupid
export function handleChainlinkUpdate(event: ethereum.Block): void {
  let synthetixProxyContract = ProxyERC20.bind(Address.fromHexString('0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f') as Address);
  let synthetixAddress = synthetixProxyContract.try_target();

  if(synthetixAddress.reverted) {
    log.warning('snx base contract not available', []);
    return;
  }

  let synthetixContract = Synthetix.bind(synthetixAddress.value);

  let resolverAddress = synthetixContract.try_resolver();

  if(resolverAddress.reverted) {
    log.warning('snx resolver not available', []);
    return;
  }

  let resolverContract = AddressResolver.bind(resolverAddress.value);
  let ratesAddress = resolverContract.try_getAddress(strToBytes('ExchangeRates'));
  
  if(ratesAddress.reverted) {
    log.warning('could not get exchangerates address from resolver', []);
    return;
  }

  let ratesContract = ExchangeRates.bind(ratesAddress.value);

  let aggregatorKey: ethereum.CallResult<Bytes>;
  let index = 0;
  do {
    aggregatorKey = ratesContract.try_aggregatorKeys(BigInt.fromI32(index++));

    if(!aggregatorKey.reverted) {
      let aggregatorAddress = ratesContract.try_aggregators(aggregatorKey.value);

      if(!aggregatorAddress.reverted) {
        addAggregator(aggregatorKey.value.toString(), aggregatorAddress.value, event.number);
      }
    }

  } while(!aggregatorKey.reverted);

}