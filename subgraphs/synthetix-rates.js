const { clone } = require('lodash');
const latestRates = require('./fragments/latest-rates');

const manifest = []; //clone(latestRates.dataSources);

// for exchange rates, modify the handler for the latest rates handler which does most of the work for us
for (const lrm of clone(latestRates.dataSources)) {
  lrm.mapping.file = '../src/rates.ts';
  manifest.push(lrm);
}

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Rates API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './synthetix-rates.graphql',
  },
  dataSources: manifest,
  templates: latestRates.templates,
};
