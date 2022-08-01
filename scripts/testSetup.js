const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Currently matchstick (the testing framework), requires the configuration to be in yaml.
 * 1. This function reads the main subgraph configuration file.
 * 2. Convert to yaml
 * 3. Writes out the yaml file with required "main.yaml" in the root level.
 *
 * The function below `afterTests` will remove this file.
 *
 * When matchstick add support for non yaml configs we can remove this workaround
 *
 */
const prepareTests = () => {
  const main = require('../subgraphs/main.js');
  const yamlContent = yaml.dump(main);
  fs.writeFileSync(path.join(__dirname, '../subgraphs/main.yaml'), yamlContent);
};

const afterTests = () => {
  try {
    fs.rmSync(path.join(__dirname, '../subgraphs/main.yaml'));
  } catch (error) {
    console.log(error);
  }
};
module.exports = { prepareTests, afterTests };
