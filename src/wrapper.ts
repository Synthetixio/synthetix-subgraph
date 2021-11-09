import { DataSourceContext, dataSource, Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Wrapper } from '../generated/subgraphs/wrapper/schema';
import { WrapperTemplate } from '../generated/subgraphs/wrapper/templates';
import { getUSDAmountFromAssetAmount, getLatestRate, strToBytes } from './lib/helpers';
import { contracts } from '../generated/contracts';
import { AddressResolver } from '../generated/subgraphs/wrapper/systemSettings_0/AddressResolver';
import { ethereum } from '@graphprotocol/graph-ts/chain/ethereum';

function handleWrapperCreated(token: Address, currencyKey: string, wrapperAddress: Address): void {
  let context = new DataSourceContext();
  context.setString('wrapperAddress', wrapperAddress.toString());

  let wrapper = WrapperTemplate.createWithContext(wrapperAddress, context);
  wrapper.tokenAddress = token;
  wrapper.currencyKey = currencyKey;
  wrapper.save();
}

function handleMinted(
  account: Address,
  principal: BigDecimal,
  fee: BigDecimal,
  amountIn: number,
  transaction: ethereum.Transaction,
): void {
  let context = dataSource.context();
  let wrapperAddress = context.getString('wrapperAddress');
  let wrapper = Wrapper.load(wrapperAddress);

  wrapper.amount += amountIn;

  let txHash = transaction.hash.toHex();
  let latestRate = getLatestRate(wrapperAddress, txHash);
  let amountInUSD = getUSDAmountFromAssetAmount(wrapper.amount, latestRate);
  wrapper.amountInUSD = amountInUSD;

  wrapper.save();
}

function handleBurned(
  account: Address,
  principal: BigDecimal,
  fee: BigDecimal,
  amountIn: number,
  transaction: ethereum.Transaction,
): void {
  let context = dataSource.context();
  let wrapperAddress = context.getString('wrapperAddress');
  let wrapper = Wrapper.load(wrapperAddress);

  wrapper.amount -= amountIn;

  let txHash = transaction.hash.toHex();
  let latestRate = getLatestRate(wrapperAddress, txHash);
  let amountInUSD = getUSDAmountFromAssetAmount(wrapper.amount, latestRate);
  wrapper.amountInUSD = amountInUSD;

  wrapper.save();
}

function handleWrapperMaxTokenAmountUpdated(wrapperAddress: Address, maxTokenAmount: BigDecimal): void {
  let wrapper = Wrapper.load(wrapperAddress);
  wrapper.maxAmount = maxTokenAmount;
  wrapper.save();
}

function handleEtherWrapperMaxETHUpdated(maxETH: BigDecimal): void {
  let addressResolverAddress = Address.fromHexString(
    contracts.get('addressresolver-' + dataSource.network()),
  ) as Address;
  let resolver = AddressResolver.bind(addressResolverAddress);
  let etherWrapperAddress = resolver.try_getAddress(strToBytes('EtherWrapper', 32));
  if (etherWrapperAddress.reverted) {
    return;
  }

  let wrapper = Wrapper.load(etherWrapperAddress.value);
  wrapper.maxAmount = maxETH;
  wrapper.save();
}
