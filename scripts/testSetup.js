const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Currently matchstick (the testing framework) have no way of providing a different path to the subgraph configuration file,
 * it requires it to be in the root folder.
 * It also requires the configuration to be in yaml.
 * 1. This function reads the main subgraph configuration file.
 * 2. Updates paths to be relative to the root level
 * 3. Convert to yaml
 * 4. Writes out the yaml file with required "subgraph.yaml" in the root level.
 *
 * The function below `afterTests` will remove this file.
 *
 * When matchstick add support config file with different name, non root path and non yaml we can remove this workaround
 *
 */
const prepareTests = () => {
  const main = require('../subgraphs/main.js');
  main.schema.file = main.schema.file.replace('./', './subgraphs/');
  main.dataSources.forEach((dataSource) => {
    dataSource.mapping.file = dataSource.mapping.file.replace('../', './');
    dataSource.mapping.abis.forEach((abi) => {
      abi.file = abi.file.replace('../', './');
    });
  });
  main.templates.forEach((template) => {
    template.mapping.file = template.mapping.file.replace('../', './');
    template.mapping.abis.forEach((abi) => {
      abi.file = abi.file.replace('../', './');
    });
  });
  const yamlContent = yaml.dump(main);
  fs.writeFileSync(path.join(__dirname, '../subgraph.yaml'), yamlContent);
};

const afterTests = () => {
  try {
    fs.rmSync(path.join(__dirname, '../subgraph.yaml'));
  } catch (error) {
    console.log(error);
  }
};
module.exports = { prepareTests, afterTests };
