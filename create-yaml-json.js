/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const path = require('path');
const { gray } = require('chalk');
const program = require('commander');

/**
 * This contract is used twice in the rates yaml file
 * with different start blocks and ABIs for each entry
 * so we need to handle it as a unique case when generating
 * the yaml files using the mustache templating engine
 */
const DOUBLE_ABI_CONTRACT = {
  address: '0xba727c69636491ecdfE3E6F64cBE9428aD371e48',
  name: 'ExchangeRates',
  startBlock: 10773070,
};

/**
 * This file is used to generate the yaml files for rates and exchanger subgraphs and
 * more can be added in the future as necessary. The rates yaml is needed in both
 * of these subgraphs and it is very long so this saves on code duplication and makes
 * it easier to change the start blocks in both of these subgraphs for testing
 */
program.action(async subgraph => {
  const baseIndexPath = path.join(__dirname, 'mustache', 'templates', 'base', 'index.js');
  const specificIndexPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'index.js');
  const dataSourcesPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'data-sources.js');
  let dataSourcesData;

  if (subgraph === 'exchanger') {
    const ratesDataSourcesPath = path.join(__dirname, 'mustache', 'templates', 'rates', 'data-sources.js');
    const ratesDataSourcesData = require(ratesDataSourcesPath);

    const ratesDifferencesPath = path.join(__dirname, 'mustache', 'templates', subgraph, 'rates-differences.js');
    const ratesDifferences = require(ratesDifferencesPath);

    const formattedRatesData = ratesDataSourcesData.map(dataSource => {
      const formattedAddress = dataSource.address.replace(/[']+/g, '');
      if (ratesDifferences[formattedAddress] && ratesDifferences[formattedAddress].startBlock) {
        dataSource.startBlock = ratesDifferences[formattedAddress].startBlock;
        // handle the DOUBLE_ABI_CONTRACT edge case (see explanation above)
        if (DOUBLE_ABI_CONTRACT.address === formattedAddress && dataSource.name === DOUBLE_ABI_CONTRACT.name) {
          dataSource.startBlock = DOUBLE_ABI_CONTRACT.startBlock;
        }
      }
      return dataSource;
    });
    const exchangerDataSourcesData = require(dataSourcesPath);
    dataSourcesData = [...exchangerDataSourcesData, ...formattedRatesData];
  } else {
    dataSourcesData = require(dataSourcesPath);
  }
  const indexData = require(baseIndexPath);
  const specificIndexData = require(specificIndexPath);
  indexData.yaml[0] = { ...indexData.yaml[0], ...specificIndexData };
  indexData.yaml[0].dataSources = dataSourcesData;

  const targetFile = path.join(__dirname, 'mustache', 'yaml_output', `synthetix-${subgraph}.json`);
  console.log(gray('Writing JSON file:', `synthetix-${subgraph}.json`));
  fs.writeFileSync(targetFile, JSON.stringify(indexData, null, 2) + '\n');
});

program.parse(process.argv);
