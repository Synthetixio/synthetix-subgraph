const { clone } = require('lodash');
const latestRates = require('./fragments/latest-rates');

const manifest = []; //clone(latestRates.dataSources);

// for exchange rates, modify so we can capture the snx price
for (const lrm of clone(latestRates.dataSources)) {
  if (lrm.name !== 'ChainlinkMultisig') {
    lrm.mapping.file = '../src/rates.ts';
  }
  manifest.push(lrm);
}

const templates = clone(latestRates.templates);

// handle SNX price and rate updates by overriding template
templates.find((v) => v.name == 'Aggregator').mapping.file = '../src/rates.ts';
templates.find((v) => v.name == 'InverseAggregator').mapping.file = '../src/rates.ts';
templates.find((v) => v.name == 'SynthAggregator').mapping.file = '../src/rates.ts';

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Rates API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './rates.graphql',
  },
  dataSources: manifest,
  templates: templates,
};
