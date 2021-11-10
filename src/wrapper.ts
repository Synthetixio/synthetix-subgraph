import { DataSourceContext, dataSource, Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Wrapper, Mint, Burn } from '../generated/subgraphs/wrapper/schema';
import { WrapperTemplate } from '../generated/subgraphs/wrapper/templates';
import { getUSDAmountFromAssetAmount, getLatestRate, strToBytes, toDecimal } from './lib/helpers';
import { contracts } from '../generated/contracts';
import { AddressResolver } from '../generated/subgraphs/wrapper/systemSettings_0/AddressResolver';
import { ethereum } from '@graphprotocol/graph-ts/chain/ethereum';

function handleWrapperCreated(token: Address, currencyKey: string, wrapperAddress: Address): void {
  let context = new DataSourceContext();
  context.setString('wrapperAddress', wrapperAddress.toString());

  let wrapper = WrapperTemplate.createWithContext(wrapperAddress, context);
  wrapper.tokenAddress = token;
  wrapper.currencyKey = strToBytes(currencyKey, 4);
  wrapper.save();
}

function handleMinted(
  account: Address,
  principal: BigDecimal,
  fee: BigDecimal,
  amountIn: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  logIndex: BigInt,
): void {
  // Create Mint
  let mintEntity = new Mint(transaction.hash.toHex() + '-' + logIndex.toString());
  mintEntity.account = account.toHex();
  mintEntity.principal = principal;
  mintEntity.fee = fee;
  mintEntity.amountIn = amountIn;
  mintEntity.timestamp = block.timestamp;
  mintEntity.save();

  // Update Wrapper
  let context = dataSource.context();
  let wrapperAddress = context.getString('wrapperAddress');
  let wrapper = Wrapper.load(wrapperAddress);

  wrapper.amount += principal;
  wrapper.totalFees += fee;

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
  block: ethereum.Block,
  logIndex: BigInt,
): void {
  // Create Burn
  let burnEntity = new Burn(transaction.hash.toHex() + '-' + logIndex.toString());
  burnEntity.account = account.toHex();
  burnEntity.principal = principal;
  burnEntity.fee = fee;
  burnEntity.amountOut = amountIn;
  burnEntity.timestamp = block.timestamp;
  burnEntity.save();

  // Update Wrapper
  let context = dataSource.context();
  let wrapperAddress = context.getString('wrapperAddress');
  let wrapper = Wrapper.load(wrapperAddress);

  wrapper.amount -= amountIn;
  wrapper.totalFees += fee;

  let txHash = transaction.hash.toHex();
  let latestRate = getLatestRate(wrapperAddress, txHash);
  let amountInUSD = getUSDAmountFromAssetAmount(wrapper.amount, latestRate);
  wrapper.amountInUSD = amountInUSD;

  wrapper.save();
}

function handleWrapperMaxTokenAmountUpdated(wrapperAddress: Address, maxTokenAmount: BigDecimal): void {
  let wrapper = Wrapper.load(wrapperAddress.toString());
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
  let wrapperAddress = etherWrapperAddress.value.toString();

  let wrapper = Wrapper.load(wrapperAddress);
  // Create the EtherWrapper entity if necessary
  if (!wrapper) {
    let context = new DataSourceContext();
    context.setString('wrapperAddress', wrapperAddress);
    wrapper = WrapperTemplate.createWithContext(wrapperAddress, context);
    wrapper.currencyKey = strToBytes('ETH', 4);
  }

  wrapper.maxAmount = maxETH;
  wrapper.save();
}
