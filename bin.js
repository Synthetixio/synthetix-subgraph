#!/usr/bin/env node

const program = require('commander');
const { exchanges } = require('.');

program.command('exchanges.total').action(async () => {
  exchanges.total().then(console.log);
});
program
  .command('exchanges.since')
  // .option('-s, --since <value>')
  .action(async () => {
    exchanges.since().then(console.log);
  });

program.parse(process.argv);
