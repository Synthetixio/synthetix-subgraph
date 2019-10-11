#!/usr/bin/env node

const program = require('commander');
const { exchanges, depot } = require('.');

program
  .command('depot.userActions')
  .option('-u, --user <value>', 'An address')
  .action(async ({ user }) => {
    depot.userActions({ user }).then(console.log);
  });

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
