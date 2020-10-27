/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const path = require('path');
const { gray } = require('chalk');
const program = require('commander');

const DOUBLE_ABI_CONTRACT = {
  address: '0xba727c69636491ecdfE3E6F64cBE9428aD371e48',
  name: 'ExchangeRates',
  startBlock: 10773070,
};

program.action(async subgraph => {
  const baseIndexPath = path.join(__dirname, 'mustache', 'json', 'base', 'index.json');
  const specificIndexJsonPath = path.join(__dirname, 'mustache', 'json', subgraph, 'index.json');
  const dataSourcesJsonPath = path.join(__dirname, 'mustache', 'json', subgraph, 'data-sources.json');
  let dataSourcesData;

  if (subgraph === 'exchanger') {
    const ratesDataSourcesPath = path.join(__dirname, 'mustache', 'json', 'rates', 'data-sources.json');
    const ratesDataSourcesData = JSON.parse(fs.readFileSync(ratesDataSourcesPath));

    const ratesDifferencesPath = path.join(__dirname, 'mustache', 'json', subgraph, 'rates-differences.json');
    const ratesDifferences = JSON.parse(fs.readFileSync(ratesDifferencesPath));

    const formattedRatesData = ratesDataSourcesData.map(dataSource => {
      const formattedAddress = dataSource.address.replace(/[']+/g, '');
      if (ratesDifferences[formattedAddress] && ratesDifferences[formattedAddress].startBlock) {
        dataSource.startBlock = ratesDifferences[formattedAddress].startBlock;
        // handle a weird edge case where we have the same address with two separate
        // entries and different abis and start blocks
        if (DOUBLE_ABI_CONTRACT.address === formattedAddress && dataSource.name === DOUBLE_ABI_CONTRACT.name) {
          dataSource.startBlock = DOUBLE_ABI_CONTRACT.startBlock;
        }
      }
      return dataSource;
    });
    const exchangerDataSourcesData = JSON.parse(fs.readFileSync(dataSourcesJsonPath));
    dataSourcesData = [...exchangerDataSourcesData, ...formattedRatesData];
  } else {
    dataSourcesData = JSON.parse(fs.readFileSync(dataSourcesJsonPath));
  }
  const indexData = JSON.parse(fs.readFileSync(baseIndexPath));
  const specificIndexData = JSON.parse(fs.readFileSync(specificIndexJsonPath));
  indexData.yaml[0] = { ...indexData.yaml[0], ...specificIndexData };
  indexData.yaml[0].dataSources = dataSourcesData;

  const targetFile = path.join(__dirname, 'mustache', 'json', 'output', `synthetix-${subgraph}.json`);
  console.log(gray('Writing JSON file:', `synthetix-${subgraph}.json`));
  fs.writeFileSync(targetFile, JSON.stringify(indexData, null, 2) + '\n');
});

program.parse(process.argv);
