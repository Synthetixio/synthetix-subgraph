import { Address, BigDecimal, BigInt, dataSource } from '@graphprotocol/graph-ts';
import {
  Synth as SynthContract,
  Transfer as SynthTransferEvent,
} from '../../generated/subgraphs/issuance/balances_SynthsUSD_0/Synth';
import { SynthAdded, SynthRemoved } from '../../generated/subgraphs/issuance/balances_Issuer_0/Issuer';

import { Synth, SynthBalance, LatestSynthBalance } from '../../generated/subgraphs/issuance/schema';
import { FEE_ADDRESS, toDecimal, ZERO, ZERO_ADDRESS } from '../lib/util';

function trackSynthHolder(synthAddress: Address, account: Address, timestamp: BigInt, value: BigDecimal): void {
  let totalBalance = toDecimal(ZERO);
  let latestBalanceID = account.toHex() + '-' + synthAddress.toHex();
  let oldSynthBalance = LatestSynthBalance.load(latestBalanceID);

  if (oldSynthBalance == null || oldSynthBalance.timestamp.equals(timestamp)) {
    totalBalance = toDecimal(SynthContract.bind(synthAddress).balanceOf(account));
  } else {
    totalBalance = oldSynthBalance.amount.plus(value);
  }

  let newLatestBalance = new LatestSynthBalance(latestBalanceID);
  newLatestBalance.account = account;
  newLatestBalance.timestamp = timestamp;
  newLatestBalance.synth = synthAddress.toHex();
  newLatestBalance.amount = totalBalance;
  newLatestBalance.save();

  let newBalanceID = timestamp.toString() + '-' + account.toHex() + '-' + synthAddress.toHex();
  let newBalance = new SynthBalance(newBalanceID);
  newBalance.account = account;
  newBalance.timestamp = timestamp;
  newBalance.synth = synthAddress.toHex();
  newBalance.amount = totalBalance;
  newBalance.save();
}

export function handleAddSynth(event: SynthAdded): void {
  let synthAddress = event.params.synth.toHex();

  // the address associated with the issuer may not be the proxy
  let synthBackContract = SynthContract.bind(event.params.synth);
  let proxyQuery = synthBackContract.try_proxy();

  if (!proxyQuery.reverted) {
    synthAddress = proxyQuery.value.toHex();
  }

  let newSynth = new Synth(synthAddress);
  newSynth.name = event.params.currencyKey.toString();
  newSynth.symbol = event.params.currencyKey.toString();
  newSynth.save();
}

export function handleRemoveSynth(_: SynthRemoved): void {
  // do nothing
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  if (event.params.from.toHex() != ZERO_ADDRESS.toHex() && event.params.from.toHex() != FEE_ADDRESS.toHex()) {
    trackSynthHolder(event.address, event.params.from, event.block.timestamp, toDecimal(event.params.value).neg());
  }
  if (event.params.to.toHex() != ZERO_ADDRESS.toHex() && event.params.to.toHex() != FEE_ADDRESS.toHex()) {
    trackSynthHolder(event.address, event.params.to, event.block.timestamp, toDecimal(event.params.value));
  }
}
