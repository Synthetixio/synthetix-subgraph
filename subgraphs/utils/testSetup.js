/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const Mustache = require('mustache');
const program = require('commander');
const contracts = require('../synthetix/mustache/contracts');
const template = require('../synthetix/mustache/test');

program
  .command('init-subgraph')
  .description('Creates the necessary yaml and helper files for any supported synthetix subgraph')
  .option(
    '-s, --subgraph <value>',
    'defaults to synthetix but can be named after any folder under the main level subgraphs folder',
    'synthetix',
  )
  .action(async ({ subgraph }) =>
    contracts.networks.map(network =>
      fs.writeFileSync(`./${subgraph}-${network}-1.yaml`, Mustache.render(template(network), contracts)),
    ),
  );

program.parse(process.argv);
