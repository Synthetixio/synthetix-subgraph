/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const path = require('path');
const { gray } = require('chalk');
const program = require('commander');
const snx = require('synthetix');

program.action(async () => {
  const abiPath = path.join(__dirname, 'abis');
  const sources = snx.getSource({ network: 'mainnet' });

  Object.entries(sources).forEach(([source, { abi }]) => {
    const targetFile = path.join(abiPath, `${source}.json`);
    console.log(gray('Writing ABI:', `${source}.json`));
    fs.writeFileSync(targetFile, JSON.stringify(abi, null, 2) + '\n');
  });
});

program.parse(process.argv);
