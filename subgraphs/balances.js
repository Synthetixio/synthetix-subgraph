const { clone } = require('lodash');
const balances = require('./fragments/balances');

module.exports = {
  specVersion: '0.0.4',
  description: 'Synthetix Balances API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './balances.graphql',
  },
  dataSources: balances.dataSources,
};
