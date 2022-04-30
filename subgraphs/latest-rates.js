const latestRates = require('./fragments/latest-rates');

const { createSubgraphManifest } = require('./utils/network');

module.exports = createSubgraphManifest('latest-rates', latestRates.dataSources, latestRates.templates);
