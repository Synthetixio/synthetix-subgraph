const latestRates = require('./fragments/latest-rates');

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Latest Rates API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './latest-rates.graphql',
  },
  dataSources: latestRates.dataSources,
  templates: latestRates.templates,
};
