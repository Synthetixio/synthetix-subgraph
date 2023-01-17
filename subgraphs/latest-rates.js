const latestRates = require('./fragments/latest-rates');

module.exports = {
  specVersion: '0.0.4',
  description: 'Kwenta Rates API',
  repository: 'https://github.com/Kwenta/kwenta-subgraph',
  schema: {
    file: './latest-rates.graphql',
  },
  dataSources: latestRates.dataSources,
  templates: latestRates.templates,
};
