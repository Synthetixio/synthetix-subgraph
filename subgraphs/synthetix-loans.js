const { getContractDeployments, getCurrentNetwork } = require('./utils/network');

const manifest = [];

/**
 * NOTE look at why the EtherCollateral doesn't have Partial Liquidation entity
 * or collateral change entities like EtherCollateralsUSD
 */

getContractDeployments('EtherCollateral').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `EtherCollateral_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'EtherCollateral',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
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
          handler: 'handleLoanLiquidated',
        },
        {
          event: 'LoanCreated(indexed address,uint256,uint256)',
          handler: 'handleLoanCreatedEther',
        },
        {
          event: 'LoanClosed(indexed address,uint256,uint256)',
          handler: 'handleLoanClosedEther',
        },
      ],
    },
  });
});

getContractDeployments('EtherCollateralsUSD').forEach((a, i) => {
  manifest.push({
    kind: 'ethereum/contract',
    name: `EtherCollateralsUSD_${i}`,
    network: getCurrentNetwork(),
    source: {
      address: a.address,
      startBlock: a.startBlock,
      abi: 'EtherCollateralsUSD',
    },
    mapping: {
      kind: 'ethereum/events',
      apiVersion: '0.0.4',
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
          handler: 'handleLoanLiquidated',
        },
        {
          event: 'LoanCreated(indexed address,uint256,uint256)',
          handler: 'handleLoanCreatedsUSD',
        },
        {
          event: 'LoanClosed(indexed address,uint256,uint256)',
          handler: 'handleLoanClosedsUSD',
        },
        {
          event: 'LoanPartiallyLiquidated(indexed address,uint256,address,uint256,uint256)',
          handler: 'handleLoanPartiallyLiquidated',
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
          event: 'LoanRepaid(indexed address,uint256,uint256,uint256)',
          handler: 'handleLoanRepaid',
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
    file: './synthetix-loans.graphql',
  },
  dataSources: manifest,
};
