/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const { getVersions } = require('synthetix');
const path = require('path');
const program = require('commander');

/**
 * This file is used to generate the yaml files for rates and exchanger subgraphs and
 * more can be added in the future as necessary. The rates yaml is needed in both
 * of these subgraphs and it is very long so this saves on code duplication and makes
 * it easier to change the start blocks in both of these subgraphs for testing
 */
program
  .command('create-yaml')
  .description('Creates yaml files using the mustache templating engine')
  .option(
    '-s, --subgraph <value>',
    'the subgraph for which you are creating the yaml file. Currently only "exchanger" and "rates" are supported',
  )
  .option(
    '-e, --env <value>',
    'defaults to "prod" and uses the prod start blocks config. Must set to "test" to use test start blocks config',
    'prod',
  )
  .option(
    '-u, --universal-test-block <value>',
    'a universal starting block for faster testing with recent history. only applicable in "test" mode',
    null,
  )
  .option(
    '-a, --etherscan <value>',
    'API key for etherscan needed for getting the block a contract was deployed on',
    null,
  )
  .action(async ({ subgraph, env, universalTestBlock }) => {
    const baseIndexPath = path.join(__dirname, 'mustache', 'templates', 'base', 'index.js');
    const specificIndexPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'index.js');
    const dataSourcesPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'create-yaml.js');
    let dataSourcesData;

    if (subgraph === 'synth-transfers') {
      // steps
      // step 1 - call get versions and get the contract addresses
      // step 2 - call etherscan and get the contract deployed blocks (throttle requests 4 per second - API limit is 5 per second)
      // step 3 - save the set-start-blocks files to disk
      // step 4 - call the create-yaml function which will use the set-start-blocks file
    } else if (subgraph === 'exchanger') {
      const ratesDataSourcesPath = path.join(__dirname, 'mustache', 'templates', 'rates', 'create-yaml.js');
      const ratesDataSourcesData = require(ratesDataSourcesPath);
      const exchangerDataSourcesData = require(dataSourcesPath);
      dataSourcesData = [
        ...exchangerDataSourcesData.createYaml(env, universalTestBlock),
        ...ratesDataSourcesData.createYaml(env, universalTestBlock, subgraph),
      ];
    } else {
      dataSourcesData = require(dataSourcesPath).createYaml(env, universalTestBlock);
    }
    const indexData = require(baseIndexPath);
    const specificIndexData = require(specificIndexPath);
    indexData.yaml[0] = { ...indexData.yaml[0], ...specificIndexData };
    indexData.yaml[0].dataSources = dataSourcesData;

    return console.log(JSON.stringify(indexData, null, 2) + '\n');
  });

program.parse(process.argv);

const getVersions = () => {
  const versions = getVersions({ network: 'mainnet', useOvm: false, byContract: true });
  console.log('versions', versions);
  return versions;
};
