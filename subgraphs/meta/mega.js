const includedSubgraphs = [
  'delegation',
  'exchanger',
  'exchanges',
  'global-debt',
  'issuance',
  'liquidations',
  'loans',
  'rates',
  'shorts',
];

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
  specVersion: '0.0.2',
  description: 'Synthetix Mega Subgraph',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './mega.graphql',
  },
  dataSources: Object.values(dataSources),
  templates: Object.values(templates),
};
