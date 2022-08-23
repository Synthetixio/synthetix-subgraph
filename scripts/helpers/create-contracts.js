/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');

const _ = require('lodash');

try {
  fs.mkdirSync(__dirname + '/../../generated/');
  /* eslint-disable no-empty */
} catch {}

const genTs = [];

genTs.push(`
import { BigInt, Address } from "@graphprotocol/graph-ts";

interface ContractInfo { address: string };

export function getContractDeployment(contractName: string, network: string, block: BigInt): Address | null {
`);

for (const network of ['mainnet', 'mainnet-ovm', 'goerli', 'goerli-ovm']) {
  const versions = require(`synthetix/publish/deployed/${network}/versions.json`);

  let networkName;
  switch (network) {
    case 'mainnet':
    case 'goerli':
      networkName = network;
      break;
    case 'mainnet-ovm':
      networkName = 'optimism';
      break;
    case 'goerli-ovm':
      networkName = 'optimism-kovan';
      break;
  }

  genTs.push(`if (network == '${networkName}') {`);

  for (const vers of _.reverse(_.values(versions))) {
    for (const c in vers.contracts) {
      genTs.push(
        `if (contractName == '${c}') return changetype<Address>(Address.fromHexString('${
          vers.contracts[c].address || '0x0'
        }'));`,
      );
    }
  }

  genTs.push('}');
}

genTs.push(`
    return null;
}
`);

fs.writeFileSync(__dirname + '/../../generated/addresses.ts', genTs.join('\n'));
