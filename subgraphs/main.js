const fs = require('fs');
const path = require('path');
const { getCurrentNetwork } = require('./utils/network');

const MAIN_SUBGRAPH_EXCLUDE = ['main.js'];

// grafting config
const currentNetwork = getCurrentNetwork();
GRAFT_BASE_OP_MAINNET = 'QmWTY7MvjLsALSXJJpHj7haGeWc8KxZ845YC1DJT7W9uAm';
GRAFT_BLOCK_OP_MAINNET = 66767120;

const graftBlock = currentNetwork === 'optimism' ? GRAFT_BLOCK_OP_MAINNET : null;

const graftBase = currentNetwork === 'optimism' ? GRAFT_BASE_OP_MAINNET : null;

const graftConfig =
  graftBase && graftBase
    ? {
        graft: {
          base: graftBase,
          block: graftBlock,
        },
        features: ['grafting'],
      }
    : {};

// create subgraphs
const includedSubgraphs = fs.readdirSync(path.join(__dirname, '../subgraphs')).reduce((acc, val) => {
  if (val.endsWith('.js') && !MAIN_SUBGRAPH_EXCLUDE.includes(val)) {
    acc.push(val.slice(0, -3));
  }
  return acc;
}, []);

const dataSources = {};
const templates = {};

for (const included of includedSubgraphs) {
  const def = require(`./${included}`);

  for (const ds of def.dataSources) {
    dataSources[ds.name] = ds;
  }

  if (def.templates) {
    for (const tl of def.templates) {
      templates[tl.name] = tl;
    }
  }
}

module.exports = {
  specVersion: '0.0.4',
  description: 'Kwenta Subgraph',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './main.graphql',
  },
  ...graftConfig,
  dataSources: Object.values(dataSources),
  templates: Object.values(templates),
};
