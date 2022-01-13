const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

/**
 * NOTE look at why the EtherCollateral doesn't have Partial Liquidation entity
 * or collateral change entities like EtherCollateralsUSD
 */

getContractDeployments('EtherCollateral').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `loans_EtherCollateral_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'EtherCollateral',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/loans.ts',
      entities: ['Loan', 'LoanCreated', 'LoanClosed', 'LoanLiquidated'],
      abis: [
        {
          name: 'EtherCollateral',
          file: '../abis/EtherCollateral.json',
        },
      ],
      eventHandlers: [
        {
          event: 'LoanLiquidated(indexed address,uint256,address)',
          handler: 'handleLoanLiquidatedLegacy',
        },
        {
          event: 'LoanCreated(indexed address,uint256,uint256)',
          handler: 'handleLoanCreatedEtherLegacy',
        },
        {
          event: 'LoanClosed(indexed address,uint256,uint256)',
          handler: 'handleLoanClosedEtherLegacy',
        },
      ],
    },
  });
});

getContractDeployments('EtherCollateralsUSD').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `loans_EtherCollateralsUSD_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'EtherCollateralsUSD',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/loans.ts',
      entities: [
        'Loan',
        'LoanCreated',
        'LoanClosed',
        'LoanLiquidated',
        'LoanPartiallyLiquidated',
        'CollateralDeposited',
        'CollateralWithdrawn',
        'LoanRepaid',
      ],
      abis: [
        {
          name: 'EtherCollateralsUSD',
          file: '../abis/EtherCollateralsUSD.json',
        },
      ],
      eventHandlers: [
        {
          event: 'LoanLiquidated(indexed address,uint256,address)',
          handler: 'handleLoanLiquidatedLegacy',
        },
        {
          event: 'LoanCreated(indexed address,uint256,uint256)',
          handler: 'handleLoanCreatedsUSDLegacy',
        },
        {
          event: 'LoanClosed(indexed address,uint256,uint256)',
          handler: 'handleLoanClosedsUSDLegacy',
        },
        {
          event: 'LoanPartiallyLiquidated(indexed address,uint256,address,uint256,uint256)',
          handler: 'handleLoanPartiallyLiquidatedLegacy',
        },
        {
          event: 'CollateralDeposited(indexed address,uint256,uint256,uint256)',
          handler: 'handleCollateralDepositedLegacy',
        },
        {
          event: 'CollateralWithdrawn(indexed address,uint256,uint256,uint256)',
          handler: 'handleCollateralWithdrawnLegacy',
        },
        {
          event: 'LoanRepaid(indexed address,uint256,uint256,uint256)',
          handler: 'handleLoanRepaidLegacy',
        },
      ],
    },
  });
});

getContractDeployments('CollateralEth').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `loans_CollateralEth_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'CollateralEth',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.5',
      language: 'wasm/assemblyscript',
      file: '../src/loans.ts',
      entities: [
        'Loan',
        'LoanCreated',
        'LoanClosed',
        'LoanLiquidated',
        'LoanPartiallyLiquidated',
        'CollateralDeposited',
        'CollateralWithdrawn',
        'LoanRepaid',
      ],
      abis: [
        {
          name: 'CollateralEth',
          file: '../abis/CollateralEth.json',
        },
      ],
      eventHandlers: [
        {
          event: 'LoanCreated(indexed address,uint256,uint256,uint256,bytes32,uint256)',
          handler: 'handleLoanCreatedEther',
        },
        {
          event: 'LoanClosed(indexed address,uint256)',
          handler: 'handleLoanClosedEther',
        },
        {
          event: 'LoanClosedByLiquidation(indexed address,uint256,indexed address,uint256,uint256)',
          handler: 'handleLoanClosedByLiquidation',
        },
        {
          event: 'LoanPartiallyLiquidated(indexed address,uint256,address,uint256,uint256)',
          handler: 'handleLoanPartiallyLiquidated',
        },
        {
          event: 'LoanRepaymentMade(indexed address,indexed address,uint256,uint256,uint256)',
          handler: 'handleLoanRepaymentMade',
        },
        {
          event: 'CollateralDeposited(indexed address,uint256,uint256,uint256)',
          handler: 'handleCollateralDeposited',
        },
        {
          event: 'CollateralWithdrawn(indexed address,uint256,uint256,uint256)',
          handler: 'handleCollateralWithdrawn',
        },
        {
          event: 'LoanDrawnDown(indexed address,uint256,uint256)',
          handler: 'handleLoanDrawnDown',
        },
      ],
    },
  });
});

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Loans API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './loans.graphql',
  },
  dataSources: manifest,
};
