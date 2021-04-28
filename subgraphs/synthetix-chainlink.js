const aggregatorManifests = require('./fragments/chainlink');

module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix Chainlink API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './synthetix-chainlink.graphql',
  },
  dataSources: aggregatorManifests,
};
