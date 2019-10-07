#!/usr/bin/env node

const program = require('commander');
const { exchanges } = require('.');

program.command('exchanges.since').action(async () => {
  exchanges.since().then(console.log);
});

program.parse(process.argv);
