const fs = require('fs');
const path = require('path');
const { createSubgraphManifest } = require('./utils/network');

const includedSubgraphs = fs.readdirSync(path.join(__dirname, '../subgraphs')).reduce((acc, val) => {
  if (val.endsWith('.js') && val !== 'main.js') {
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

module.exports = createSubgraphManifest('main', dataSources, templates);
