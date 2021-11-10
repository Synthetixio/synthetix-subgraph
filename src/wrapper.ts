import { dataSource, Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Wrapper, Mint, Burn } from '../generated/subgraphs/wrapper/schema';
import { WrapperTemplate } from '../generated/subgraphs/wrapper/templates';
import { getUSDAmountFromAssetAmount, getLatestRate, strToBytes, toDecimal } from './lib/helpers';
import { getContractDeployment } from '../generated/addresses';
import { AddressResolver } from '../generated/subgraphs/wrapper/systemSettings_0/AddressResolver';
import {
  Burned as BurnedEvent,
  Minted as MintedEvent,
} from '../generated/subgraphs/wrapper/templates/WrapperTemplate/Wrapper';
import {
  WrapperMaxTokenAmountUpdated as WrapperMaxTokenAmountUpdatedEvent,
  EtherWrapperMaxETHUpdated as EtherWrapperMaxETHUpdatedEvent,
} from '../generated/subgraphs/wrapper/systemSettings_0/SystemSettings';
import { WrapperCreated as WrapperCreatedEvent } from '../generated/subgraphs/wrapper/wrapperFactory_0/WrapperFactory';

import { log } from '@graphprotocol/graph-ts';

export function handleWrapperCreated(event: WrapperCreatedEvent): void {
  let wrapper = Wrapper.load(event.params.wrapperAddress.toString());
  if (wrapper) {
    wrapper.tokenAddress = event.params.token.toString();
    wrapper.currencyKey = event.params.currencyKey;
    wrapper.save();
  }
}

export function handleMinted(event: MintedEvent): void {
  // Create Mint
  let mintEntity = new Mint(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  mintEntity.account = event.params.account.toHex();
  mintEntity.principal = toDecimal(event.params.principal);
  mintEntity.fee = toDecimal(event.params.fee);
  mintEntity.amountIn = toDecimal(event.params.amountIn);
  mintEntity.timestamp = event.block.timestamp;
  mintEntity.save();

  // Update Wrapper
  let wrapper = Wrapper.load(event.address.toHexString());

  // if !wrapper, instantiate it, we know it's the ETH wrapper
  if (!wrapper) {
    wrapper = new Wrapper(event.address.toHexString());
    if (wrapper) {
      wrapper.currencyKey = strToBytes('ETH', 4);
    }
  }

  if (wrapper) {
    let txHash = event.transaction.hash.toString();
    let latestRate = getLatestRate(wrapper.currencyKey.toString(), txHash);

    wrapper.amount += toDecimal(event.params.principal);
    wrapper.totalFees += toDecimal(event.params.fee);

    if (latestRate) {
      let amountInUSD = getUSDAmountFromAssetAmount(event.params.principal, latestRate);
      wrapper.amountInUSD = amountInUSD;
      wrapper.totalFeesInUSD += amountInUSD;
    }

    wrapper.save();
  }
}

export function handleBurned(event: BurnedEvent): void {
  // Create Burn
  let burnEntity = new Burn(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  burnEntity.account = event.params.account.toHex();
  burnEntity.principal = toDecimal(event.params.principal);
  burnEntity.fee = toDecimal(event.params.fee);
  burnEntity.amountOut = toDecimal(event.params.amountIn);
  burnEntity.timestamp = event.block.timestamp;
  burnEntity.save();

  // Update Wrapper
  let wrapper = Wrapper.load(event.address.toHexString());

  if (wrapper) {
    let txHash = event.transaction.hash.toString();
    let latestRate = getLatestRate(wrapper.currencyKey.toString(), txHash);

    wrapper.amount -= toDecimal(event.params.amountIn);
    wrapper.totalFees += toDecimal(event.params.fee);

    if (latestRate) {
      let amountInUSD = getUSDAmountFromAssetAmount(event.params.principal, latestRate);
      wrapper.amountInUSD = amountInUSD;
      wrapper.totalFeesInUSD += amountInUSD;
    }

    wrapper.save();
  }
}

export function handleWrapperMaxTokenAmountUpdated(event: WrapperMaxTokenAmountUpdatedEvent): void {
  let wrapper = Wrapper.load(event.params.wrapper.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxTokenAmount);
    wrapper.save();
  }
}

export function handleEtherWrapperMaxETHUpdated(event: EtherWrapperMaxETHUpdatedEvent): void {
  let addressResolverAddress = getContractDeployment(
    'AddressResolver',
    dataSource.network(),
    BigInt.fromI32(1000000000),
  )!;
  let resolver = AddressResolver.bind(addressResolverAddress);
  let etherWrapperAddress = resolver.try_getAddress(strToBytes('EtherWrapper', 32));
  if (etherWrapperAddress.reverted) {
    return;
  }
  let wrapperAddress = etherWrapperAddress.value;

  let wrapper = Wrapper.load(wrapperAddress.toString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxETH);
    wrapper.save();
  }
}
