const { clone } = require('lodash');

const { getContractDeployments, getCurrentNetwork, createSubgraphManifest } = require('./utils/network');

const latestRates = require('./fragments/latest-rates');

const manifest = clone(latestRates.dataSources);

/**
 * NOTE we need to update this file when we start using
 * different types of collateral for shorts
 */

getContractDeployments('CollateralShort').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `shorts_CollateralShort_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'CollateralShort',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/shorts.ts',
      entities: ['Short', 'ShortLiquidation', 'ShortCollateralChange', 'ShortLoanChange'],
      abis: [
        {
          name: 'AddressResolver',
          file: '../abis/AddressResolver.json',
        },
        {
          name: 'ExchangeRates',
          file: '../abis/ExchangeRates.json',
        },
        {
          name: 'AggregatorProxy',
          file: '../abis/AggregatorProxy.json',
        },
        {
          name: 'CollateralShort',
          file: '../abis/CollateralShortOVM.json',
        },
      ],
      eventHandlers: [
        {
          event: 'LoanCreated(indexed address,uint256,uint256,uint256,bytes32,uint256)',
          handler: 'handleShortLoanCreatedsUSD',
        },
        {
          event: 'LoanClosed(indexed address,uint256)',
          handler: 'handleShortLoanClosedsUSD',
        },
        {
          event: 'CollateralDeposited(indexed address,uint256,uint256,uint256)',
          handler: 'handleShortCollateralDepositedsUSD',
        },
        {
          event: 'CollateralWithdrawn(indexed address,uint256,uint256,uint256)',
          handler: 'handleShortCollateralWithdrawnsUSD',
        },
        {
          event: 'LoanRepaymentMade(indexed address,indexed address,uint256,uint256,uint256)',
          handler: 'handleShortLoanRepaymentMadesUSD',
        },
        {
          event: 'LoanDrawnDown(indexed address,uint256,uint256)',
          handler: 'handleShortLoanDrawnDownsUSD',
        },
        {
          event: 'LoanPartiallyLiquidated(indexed address,uint256,address,uint256,uint256)',
          handler: 'handleLoanPartiallyLiquidatedsUSD',
        },
        {
          event: 'LoanClosedByLiquidation(indexed address,uint256,indexed address,uint256,uint256)',
          handler: 'handleLoanClosedByLiquidationsUSD',
        },
        {
          event: 'MinCollateralUpdated(uint256)',
          handler: 'handleMinCollateralUpdatedsUSD',
        },
        {
          event: 'IssueFeeRateUpdated(uint256)',
          handler: 'handleIssueFeeRateUpdatedsUSD',
        },
        {
          event: 'CanOpenLoansUpdated(bool)',
          handler: 'handleCanOpenLoansUpdatedsUSD',
        },
        {
          event: 'LoanClosedByRepayment(indexed address,uint256,uint256,uint256)',
          handler: 'handleLoanClosedByRepayment',
        },
      ],
    },
  });
});

module.exports = createSubgraphManifest('shorts', manifest, latestRates.templates);
