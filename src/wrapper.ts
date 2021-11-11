import { dataSource, BigInt, DataSourceContext } from '@graphprotocol/graph-ts';
import { Wrapper, WrapperMint, WrapperBurn } from '../generated/subgraphs/wrapper/schema';
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

export function handleWrapperCreated(event: WrapperCreatedEvent): void {
  let context = new DataSourceContext();
  context.setString('tokenAddress', event.params.token.toHexString());
  context.setString('currencyKey', event.params.currencyKey.toString());
  WrapperTemplate.createWithContext(event.params.wrapperAddress, context);
}

export function handleMinted(event: MintedEvent): void {
  // Create Mint
  let mintEntity = new WrapperMint(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  mintEntity.account = event.params.account.toHexString();
  mintEntity.principal = toDecimal(event.params.principal);
  mintEntity.fee = toDecimal(event.params.fee);
  mintEntity.amountIn = toDecimal(event.params.amountIn);
  mintEntity.timestamp = event.block.timestamp;
  mintEntity.wrapperAddress = event.address.toHexString();
  mintEntity.save();

  // Update Wrapper
  let wrapper = Wrapper.load(event.address.toHexString());

  // If there isn't a wrapper yet at this address, it's the ETH wrapper, and needs to be instantiated.
  if (!wrapper) {
    wrapper = new Wrapper(event.address.toHexString());
    if (wrapper) {
      wrapper.currencyKey = 'ETH';
    }
  }

  // Assign values from context
  let context = dataSource.context();
  let tokenAddress = context.getString('tokenAddress');
  let currencyKey = context.getString('currencyKey');
  if (tokenAddress && tokenAddress.length) {
    wrapper.tokenAddress = tokenAddress;
    wrapper.currencyKey = currencyKey;
  }

  if (wrapper) {
    wrapper.amount = wrapper.amount.plus(toDecimal(event.params.amountIn));
    wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

    let txHash = event.transaction.hash.toString();
    let latestRate = getLatestRate(wrapper.currencyKey, txHash);
    if (latestRate) {
      wrapper.amountInUSD = wrapper.amount.times(latestRate);
      wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
    }

    wrapper.save();
  }
}

export function handleBurned(event: BurnedEvent): void {
  // Create Burn
  let burnEntity = new WrapperBurn(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  burnEntity.account = event.params.account.toHex();
  burnEntity.principal = toDecimal(event.params.principal);
  burnEntity.fee = toDecimal(event.params.fee);
  burnEntity.amountOut = toDecimal(event.params.amountIn);
  burnEntity.timestamp = event.block.timestamp;
  burnEntity.wrapperAddress = event.address.toHexString();
  burnEntity.save();

  // Update Wrapper
  let wrapper = Wrapper.load(event.address.toHexString());

  if (wrapper) {
    wrapper.amount = wrapper.amount.minus(toDecimal(event.params.amountIn));
    wrapper.totalFees = wrapper.totalFees.plus(toDecimal(event.params.fee));

    let txHash = event.transaction.hash.toHexString();
    let latestRate = getLatestRate(wrapper.currencyKey, txHash);
    if (latestRate) {
      wrapper.amountInUSD = wrapper.amount.times(latestRate);
      wrapper.totalFeesInUSD = wrapper.totalFees.times(latestRate);
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

  let wrapper = Wrapper.load(wrapperAddress.toHexString());
  if (wrapper) {
    wrapper.maxAmount = toDecimal(event.params.maxETH);
    wrapper.save();
  }
}
