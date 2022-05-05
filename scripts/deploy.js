/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const fs = require('fs');
const path = require('path');
const { green, cyan, gray, greenBright, blueBright } = require('chalk');
const program = require('commander');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const { print } = require('graphql');
const { mergeTypeDefs } = require('@graphql-tools/merge');

const fetch = require('node-fetch');

const NETWORK_CHOICES = ['mainnet', 'kovan', 'optimism', 'optimism-kovan'];

const parseBoolean = (val) => {
  return val == 'false' ? false : val;
};

async function readPreviousDeploymentId(team, subgraphName) {
  // now that we have most of the information, see if we have a previous subgraph version
  // if so, prompt the user to graft onto it
  const res = await fetch(`https://api.thegraph.com/subgraphs/name/${team}/${subgraphName}`, {
    headers: {
      'User-Agent': 'Synthetix/0.0.1',
    },
    body: '{"query":"{_meta { deployment }}","variables":null,"extensions":{"headers":null}}',
    method: 'POST',
  });

  const body = await res.json();

  return body.data ? body.data._meta.deployment : undefined;
}

function exec(cmd) {
  console.log(blueBright(`exec: ${cmd}`));
  execSync(cmd, { stdio: 'inherit' });
}

function networkPrefix(network) {
  return network + '-';
}

function buildAndDeployHosted(settings, prefixArgs) {
  const networks = settings.network == 'All' ? NETWORK_CHOICES : [settings.network];
  for (let i = 0; i < networks.length; i++) {
    const network = networks[i];

    console.log(cyan(`Building subgraph for network ${network}...`));

    try {
      exec(
        `${prefixArgs} ./node_modules/.bin/graph build ./subgraphs/${settings.subgraph}.js -o ./build/${network}/subgraphs/${settings.subgraph}`,
      );
    } catch {
      process.exit(1);
    }

    if (!settings.buildOnly) {
      if (i === 0 && settings.accessToken) {
        exec(`./node_modules/.bin/graph auth --product hosted-service ${settings.accessToken}`);
      }

      exec(
        `${prefixArgs} ./node_modules/.bin/graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ ${
          settings.team
        }/${networkPrefix(network)}${settings.subgraph} ./subgraphs/${settings.subgraph}.js`,
      );
      console.log(green(`Successfully deployed to ${network} on the hosted service.`));
    }
  }
}

async function deployDecentralized(settings, prefixArgs) {
  settings = await inquirer.prompt(
    [
      {
        message: 'Would you like to deploy to the main subgraph to the decentralized network?',
        name: 'deployDecentralized',
        type: 'confirm',
      },
    ],
    settings,
  );

  if (settings.deployDecentralized) {
    const { version: defaultVersion } = require('../node_modules/synthetix/package.json');
    settings = await inquirer.prompt(
      [
        {
          message: 'What version label should be used for this release?',
          name: 'versionLabel',
          default: defaultVersion,
        },
      ],
      settings,
    );

    console.log('Deploying to decentralized network...');
    if (settings.accessToken) {
      exec(`./node_modules/.bin/graph auth --product subgraph-studio ${settings.accessToken}`);
    }

    exec(
      `${prefixArgs} ./node_modules/.bin/graph deploy --studio ${settings.team} --version-label ${settings.versionLabel} ./subgraphs/main.js`,
    );
    console.log(green('Successfully deployed to decentralized network.'));
  }
}

async function buildAndDeploy(settings, prefixArgs) {
  if (settings.network === 'None') {
    // With the old logic, if network was None and deployDecentralized is true we would NOT build and try to deploy to decentralised network.
    // I think we dont want to deploy anything when network is None?
    return;
  }
  buildAndDeployHosted(settings, prefixArgs);
  if (settings.subgraph == 'main' && !settings.buildOnly) {
    await deployDecentralized(settings, prefixArgs);
  }
}

program
  .option('-u --update-synthetix [version]', 'Update the Synthetix package and contract ABIs to the given version')
  .option('-s --subgraph <names>', 'The subgraph to deploy to the hosted service')
  .option('-t --team <name>', 'The Graph team name')
  .option('-n --network <value>', 'Network to deploy on for the hosted service')
  .option('-a --access-token <token>', 'The Graph access token')
  .option('-d, --deploy-decentralized [value]', 'Deploy to the decentralized network', parseBoolean)
  .option('-v, --version-label [value]', 'Version label for the deployment to the decentralized network')
  .option('--build-only', 'Skip deploy')
  .option(
    '--graft-base <id>',
    'ID of subgraph to graft. If unspecified, will attempt to read existing from the graph API',
  )
  .option('--graft-block <number>', 'Block to begin the graft. 0 disables grafting');

program.action(async () => {
  const SUBGRAPH_CHOICES = fs.readdirSync(path.join(__dirname, '../subgraphs')).reduce((acc, val) => {
    if (val.endsWith('.js') && val !== 'main.js') {
      acc.push(val.slice(0, -3));
    }
    return acc;
  }, []);
  const OPTIONS = program.opts();

  if (OPTIONS.updateSynthetix) {
    console.log(cyan('Updating the Synthetix package and contract ABIs...'));
    exec(`npm install synthetix@${OPTIONS.updateSynthetix == true ? 'latest' : OPTIONS.updateSynthetix}`);
    console.log(green('Successfully updated the Synthetix package for the most recent contracts.'));
    exec('node scripts/helpers/prepare-abis.js');
    console.log(green('Successfully prepared the ABI files for subgraph generation.'));
  }

  const inquiries = [];

  if (!OPTIONS.subgraph) {
    inquiries.push({
      message:
        'Which subgraph would you like to deploy? ' +
        gray('You should only deploy subgraphs other than the main subgraph for development and testing.'),
      name: 'subgraph',
      type: 'list',
      default: 'main',
      choices: [{ name: 'Main Subgraph', value: 'main' }, new inquirer.Separator(), ...SUBGRAPH_CHOICES],
    });
  }

  if (!OPTIONS.network) {
    inquiries.push({
      message: 'Which networks should be built (and deployed)?',
      name: 'network',
      type: 'list',
      default: 'All',
      choices: ['All', 'None', new inquirer.Separator(), ...NETWORK_CHOICES],
    });
  }

  if (!OPTIONS.team) {
    OPTIONS.team = 'synthetixio-team';
    console.log(`Using default team ${OPTIONS.team}`);
  }

  let settings = {
    ...(await inquirer.prompt(inquiries, OPTIONS)),
    ...OPTIONS,
  };

  const prevDeployId =
    settings.graftBase ||
    (await readPreviousDeploymentId(settings.team, networkPrefix(settings.network) + settings.subgraph));

  if (prevDeployId && !OPTIONS.graftBlock && !OPTIONS.buildOnly) {
    await inquirer.prompt(
      [
        {
          message: `Previous graftable base found (${prevDeployId}). Specify graft start block (0 to disable):`,
          type: 'number',
          name: 'graftBlock',
        },
      ],
      OPTIONS,
    );
  }

  if (settings.subgraph == 'main') {
    console.log('Generating the main subgraph...');

    // We merge using this strategy to avoid duplicates from the fragments
    let typesArray = [];
    for (let i = 0; i < SUBGRAPH_CHOICES.length; i++) {
      typesArray.push(fs.readFileSync(path.join(__dirname, `../subgraphs/${SUBGRAPH_CHOICES[i]}.graphql`)).toString());
    }
    const typeDefs = mergeTypeDefs(typesArray);

    // https://www.graphql-tools.com/docs/schema-merging#print-merged-typedefs
    const AUTOGEN_NOTICE = '""" THIS FILE IS AUTOMATICALLY GENERATED BY THE DEPLOY SCRIPT """\n\n ';
    const printedTypeDefs = print(typeDefs);
    fs.writeFileSync('subgraphs/main.graphql', AUTOGEN_NOTICE + printedTypeDefs);
    console.log(green('Successfully generated the main subgraph.'));
  }

  console.log(gray('Executing prebuild steps:'));

  console.log(cyan('Running The Graph’s codegen...'));
  for (let i = 0; i < SUBGRAPH_CHOICES.length; i++) {
    const subgraph = SUBGRAPH_CHOICES[i];
    exec(
      `SNX_NETWORK=mainnet SUBGRAPH=${subgraph} ./node_modules/.bin/graph codegen ./subgraphs/${subgraph}.js -o ./generated/subgraphs/${subgraph}`,
    );
  }

  console.log(cyan('Creating contracts...'));
  exec('node ./scripts/helpers/create-contracts');

  let prefixArgs = `DEBUG_MANIFEST=true SNX_START_BLOCK=${process.env.SNX_START_BLOCK || 0} SNX_NETWORK=${
    settings.network
  } SUBGRAPH=${settings.subgraph}`;

  if (settings.graftBlock) {
    prefixArgs += ` GRAFT_BASE=${prevDeployId} GRAFT_BLOCK=${settings.graftBlock}`;
  }

  await buildAndDeploy(settings, prefixArgs);

  console.log(greenBright('All operations completed successfully!'));
});

program.parse(process.argv);
