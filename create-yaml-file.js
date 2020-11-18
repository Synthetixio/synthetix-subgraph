/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const path = require('path');
const program = require('commander');
const { getVersions } = require('synthetix');
const axios = require('axios');

const createEtherscanBlockTimeLink = (timestamp, token) =>
  `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${token}`;

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
    '-a, --api-key-etherscan <value>',
    'API key for etherscan needed for getting the block a contract was deployed on',
    '',
  )
  .action(async ({ subgraph, env, universalTestBlock, apiKeyEtherscan }) => {
    const baseIndexPath = path.join(__dirname, 'mustache', 'templates', 'base', 'index.js');
    const specificIndexPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'index.js');
    const dataSourcesPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'create-yaml.js');
    let dataSourcesData;

    if (subgraph === 'synth-transfers') {
      const startBlockData = {};
      const versions = getVersions({ network: 'mainnet', useOvm: false, byContract: false });
      for (const version in versions) {
        const { tag, date, contracts } = versions[version];
        const formattedTime = new Date(date).getTime() / 1000;
        const res = await axios.get(createEtherscanBlockTimeLink(formattedTime, apiKeyEtherscan));
        if (res.status !== 200) {
          throw new Error(`api error for date: ${date}`);
        }
        // Wait 0.5s then resolve to throttle api calls
        await new Promise(resolve => setTimeout(() => resolve(), 500));
        const startBlock = Number(res.data.result);
        Object.entries(contracts).forEach(([name, { address }]) => {
          if (name.startsWith('Proxy') && !['ProxyFeePool', 'ProxySynthetix'].includes(name)) {
            startBlockData[`${name}_${tag}`] = {
              prod: startBlock,
              test: null,
              address: `'${address}'`,
            };
          }
        });
      }
      const targetFile = path.join(__dirname, 'mustache', 'templates', subgraph, 'set-start-blocks.json');
      fs.writeFileSync(targetFile, JSON.stringify(startBlockData, null, 2) + '\n');
      dataSourcesData = require(dataSourcesPath).createYaml(env, universalTestBlock);
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
