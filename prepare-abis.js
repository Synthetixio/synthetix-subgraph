/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const path = require('path');
const { gray, yellow } = require('chalk');
const program = require('commander');
const snx = require('synthetix');

program.action(async () => {
  const abiPath = path.join(__dirname, 'abis');
  const sources = snx.getSource({ network: 'mainnet' });

  const doesEntryHaveMultidimensionalArrays = ({ type }) => /\[[0-9]*\]\[[0-9]*\]/.test(type);

  Object.entries(sources)
    .map(([source, { abi }]) => {
      const { name } =
        abi.find(
          ({ inputs = [], outputs = [] }) =>
            inputs.find(doesEntryHaveMultidimensionalArrays) || outputs.find(doesEntryHaveMultidimensionalArrays),
        ) || {};
      if (name) {
        console.log(yellow(`Note: Found multidimensional array in ABI and stripping it: ${source}.${name}`));
        abi = abi.filter(entry => entry.name !== name);
      }

      return [source, { abi }];
    })
    .forEach(([source, { abi }]) => {
      const targetFile = path.join(abiPath, `${source}.json`);
      console.log(gray('Writing ABI:', `${source}.json`));
      fs.writeFileSync(targetFile, JSON.stringify(abi, null, 2) + '\n');
    });
});

program.parse(process.argv);
