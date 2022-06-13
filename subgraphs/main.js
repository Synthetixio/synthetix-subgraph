const fs = require('fs');
const path = require('path');

const MAIN_SUBGRAPH_EXCLUDE = ['main.js'];

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
  specVersion: '0.0.2',
  description: 'Kwenta Subgraph',
  repository: 'https://github.com/kwenta/kwenta-subgraph',
  schema: {
    file: './main.graphql',
  },
  dataSources: Object.values(dataSources),
  templates: Object.values(templates),
};
