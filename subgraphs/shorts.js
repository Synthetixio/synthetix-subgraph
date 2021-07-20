const { clone } = require('lodash');

const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

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
      apiVersion: '0.0.4',
      language: 'wasm/assemblyscript',
      file: '../src/shorts.ts',
      entities: ['Short', 'ShortLiquidation', 'ShortCollateralChange', 'ShortLoanChange'],
      abis: [
        {
          name: 'CollateralShort',
          file: '../abis/CollateralShort.json',
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
          event: 'MinCratioRatioUpdated(uint256)',
          handler: 'handleMinCratioRatioUpdatedsUSD',
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
          event: 'MaxLoansPerAccountUpdated(uint256)',
          handler: 'handleMaxLoansPerAccountUpdatedsUSD',
        },
        {
          event: 'InteractionDelayUpdated(uint256)',
          handler: 'handleInteractionDelayUpdatedsUSD',
        },
        {
          event: 'ManagerUpdated(address)',
          handler: 'handleManagerUpdatedsUSD',
        },
        {
          event: 'CanOpenLoansUpdated(bool)',
          handler: 'handleCanOpenLoansUpdatedsUSD',
        },
      ],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Shorts API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './shorts.graphql',
  },
  dataSources: manifest,
  templates: latestRates.templates,
};
