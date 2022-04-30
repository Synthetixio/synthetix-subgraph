const balances = require('./fragments/balances');

const { createSubgraphManifest } = require('./utils/network');

module.exports = createSubgraphManifest('balances', balances.dataSources, []);
