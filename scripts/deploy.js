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

const parseBoolean = (val) => {
  return val == 'false' ? false : val;
};

async function readPreviousDeploymentId(subgraphBaseUrl, team, subgraphName) {
  // now that we have most of the information, see if we have a previous subgraph version
  // if so, prompt the user to graft onto it
  const res = await fetch(`${subgraphBaseUrl}/subgraphs/name/${team}/${subgraphName}`, {
    headers: {
      'User-Agent': 'Synthetix/0.0.1',
    },
    body: '{"query":"{_meta { deployment }}","variables":null,"extensions":{"headers":null}}',
    method: 'POST',
  });

  const body = await res.json();

  return body.data ? body.data._meta.deployment : undefined;
}

function getNetworkSubgraphName(network, subgraph) {
  return `${networkPrefix(network)}${subgraph}`;
}

function getFullSubgraphName(teamName, network, subgraphName) {
  return `${teamName}/${getNetworkSubgraphName(network, subgraphName)}`;
}

function exec(cmd) {
  console.log(blueBright(`exec: ${cmd}`));
  execSync(cmd, { stdio: 'inherit' });
}

function networkPrefix(network) {
  return network + '-';
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
  .option('--debug', 'Print out extra debugging information')
  .option(
    '--graft-base <id>',
    'ID of subgraph to graft. If unspecified, will attempt to read existing from the graph API',
  )
  .option('--graft-block <number>', 'Block to begin the graft. 0 disables grafting')
  .option('--node <node>', 'graph node endpoint')
  .option('--ipfs <ipfs>', 'ipfs server endpoint')
  .option('--subgraph-base-url <subgraphBaseUrl>', 'subgraph base url');

program.action(async () => {
  const NETWORK_CHOICES = ['mainnet', 'kovan', 'optimism', 'optimism-kovan'];
  const SUBGRAPH_CHOICES = await fs.readdirSync(path.join(__dirname, '../subgraphs')).reduce((acc, val) => {
    if (val.endsWith('.js') && val !== 'main.js') {
      acc.push(val.slice(0, -3));
    }
    return acc;
  }, []);
  const OPTIONS = program.opts();

  if (OPTIONS.updateSynthetix) {
    console.log(cyan('Updating the Synthetix package and contract ABIs...'));
    await exec(`npm install synthetix@${OPTIONS.updateSynthetix == true ? 'latest' : OPTIONS.updateSynthetix}`);
    console.log(green('Successfully updated the Synthetix package for the most recent contracts.'));
    await exec('node scripts/helpers/prepare-abis.js');
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

  if (!OPTIONS.node) {
    OPTIONS.node = 'https://api.thegraph.com/deploy/';
    console.log(`Using default node url: ${OPTIONS.node}`);
  }

  if (!OPTIONS.ipfs) {
    OPTIONS.ipfs = 'https://api.thegraph.com/ipfs/';
    console.log(`Using default ipfs: ${OPTIONS.ipfs}`);
  }

  if (!OPTIONS.subgraphBaseUrl) {
    OPTIONS.subgraphBaseUrl = 'https://api.thegraph.com';
    console.log(`Using default subgraph base url: ${OPTIONS.subgraphBaseUrl}`);
  }

  let settings = {
    ...(await inquirer.prompt(inquiries, OPTIONS)),
    ...OPTIONS,
  };

  const prevDeployId =
    settings.graftBase ||
    (await readPreviousDeploymentId(settings.subgraphBaseUrl, settings.team, getNetworkSubgraphName(settings.network, settings.subgraph)));

  // if no previous deployment found, create the graph
  if (!prevDeployId) {
    exec(
      `./node_modules/.bin/graph create --node ${OPTIONS.node} ${settings.subgraph}`
    );
  }

  if (prevDeployId && !settings.graftBlock && !settings.buildOnly) {
    settings = {
      ...(await inquirer.prompt(
        [
          {
            message: `Previous graftable base found (${prevDeployId}). Specify graft start block (0 to disable):`,
            type: 'number',
            name: 'graftBlock',
          },
        ],
        settings,
      )),
      ...settings,
    };

    settings.graftBase = prevDeployId;
  }

  console.log('RESOLVED SETTINGS', settings);

  if (settings.subgraph == 'main') {
    console.log('Generating the main subgraph...');

    // We merge using this strategy to avoid duplicates from the fragments
    let typesArray = [];
    for (let i = 0; i < SUBGRAPH_CHOICES.length; i++) {
      typesArray.push(
        (await fs.readFileSync(path.join(__dirname, `../subgraphs/${SUBGRAPH_CHOICES[i]}.graphql`))).toString(),
      );
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
    await exec(
      `SNX_NETWORK=mainnet SUBGRAPH=${subgraph} ./node_modules/.bin/graph codegen ./subgraphs/${subgraph}.js -o ./generated/subgraphs/${subgraph}`,
    );
  }

  console.log(cyan('Creating contracts...'));
  await exec('node ./scripts/helpers/create-contracts');

  let prefixArgs = `SNX_START_BLOCK=${process.env.SNX_START_BLOCK || 0} SNX_NETWORK=${settings.network} SUBGRAPH=${
    settings.subgraph
  }`;

  if (settings.graftBlock) {
    prefixArgs += ` GRAFT_BASE=${prevDeployId} GRAFT_BLOCK=${settings.graftBlock}`;
  }

  if (settings.debug) {
    prefixArgs += ' DEBUG_MANIFEST=true';
  }

  if (settings.network !== 'None') {
    if (settings.network == 'All') {
      for (let i = 0; i < NETWORK_CHOICES.length; i++) {
        const network = NETWORK_CHOICES[i];

        console.log(cyan(`Building subgraph for network ${network}...`));

        try {
          await exec(
            `${prefixArgs} ./node_modules/.bin/graph build ./subgraphs/${settings.subgraph}.js -o ./build/${network}/subgraphs/${settings.subgraph}`,
          );
        } catch {
          process.exit(1);
        }

        if (!settings.buildOnly) {
          await exec(
            `${prefixArgs} ./node_modules/.bin/graph deploy --node ${settings.node} --ipfs ${settings.ipfs} ${
              getFullSubgraphName(settings.team, settings.network, settings.subgraph)
            } ./subgraphs/${settings.subgraph}.js`,
          );
          console.log(green(`Successfully deployed to ${network} on the hosted service.`));
        }
      }
    } else {
      console.log(cyan(`Building subgraph for network ${settings.network}...`));
      try {
        await exec(
          `${prefixArgs} ./node_modules/.bin/graph build ./subgraphs/${settings.subgraph}.js -o ./build/${settings.network}/subgraphs/${settings.subgraph}`,
        );
      } catch {
        process.exit(1);
      }

      if (!settings.buildOnly) {
        await exec(
          `${prefixArgs} ./node_modules/.bin/graph deploy --node ${settings.node} --ipfs ${settings.ipfs} ${
            getFullSubgraphName(settings.team, settings.network, settings.subgraph)
          } ./subgraphs/${settings.subgraph}.js`,
        );
        console.log(green(`Successfully deployed to ${settings.network} on the hosted service.`));
      }
    }
  }

  if (settings.subgraph == 'main' && !settings.buildOnly) {
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
      await exec(
        `${prefixArgs} ./node_modules/.bin/graph deploy --studio ${settings.team} --version-label ${settings.versionLabel} --access-token  ${settings.access_token} ./subgraphs/main.js`,
      );
      console.log(green('Successfully deployed to decentralized network.'));
    }
  }

  console.log(greenBright('All operations completed successfully!'));
});

program.parse(process.argv);
