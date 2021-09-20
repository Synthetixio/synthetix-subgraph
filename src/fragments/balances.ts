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
  let aggregateSynthBalanceID = account.toHex() + '-' + synthAddress.toHex();
  let aggregateSynthBalance = LatestSynthBalance.load(aggregateSynthBalanceID);

  if (aggregateSynthBalance == null) {
    totalBalance = value;
    if (dataSource.network() != 'mainnet') {
      totalBalance = toDecimal(SynthContract.bind(synthAddress).balanceOf(account));
    }
  } else {
    aggregateSynthBalance.amount = totalBalance;
    aggregateSynthBalance.save();

    totalBalance = aggregateSynthBalance.amount.plus(value);
  }

  let newLatestBalance = new LatestSynthBalance(aggregateSynthBalanceID);
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
  let newSynth = new Synth(event.params.synth.toHex());
  newSynth.name = event.params.currencyKey.toString();
  newSynth.symbol = event.params.currencyKey.toString();
  newSynth.save();
}

export function handleRemoveSynth(_: SynthRemoved): void {
  // do nothing
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  if (event.params.from.toHex() != ZERO_ADDRESS.toHex() && event.params.from.toHex() != FEE_ADDRESS.toHex()) {
    trackSynthHolder(event.address, event.params.from, event.block.timestamp, toDecimal(event.params.value));
  }
  if (event.params.to.toHex() != ZERO_ADDRESS.toHex() && event.params.to.toHex() != FEE_ADDRESS.toHex()) {
    trackSynthHolder(event.address, event.params.to, event.block.timestamp, toDecimal(event.params.value).neg());
  }
}
