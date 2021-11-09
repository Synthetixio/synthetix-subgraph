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

for (const network of ['mainnet', 'mainnet-ovm', 'kovan', 'kovan-ovm']) {
  const versions = require(`synthetix/publish/deployed/${network}/versions.json`);

  let networkName;
  switch (network) {
    case 'mainnet':
    case 'kovan':
      networkName = network;
    case 'mainnet-ovm':
      networkName = 'optimism';
    case 'kovan-ovm':
      networkName = 'kovan-optimism';
  }

  genTs.push(`if (network == '${networkName}') {`);

  for (const v in versions) {
    const name = `${networkName}${v.replace(/\.|-/g, '_')}Version`;
    for (const c in versions[v].contracts) {
      genTs.push(
        `if (contractName === '${c}') return changetype<Address>(Address.fromHexString('${
          versions[v].contracts[c].address || '0x0'
        }'));`,
      );
    }
  }

  genTs.push(`}`);
}

genTs.push(`
    return null;
}
`);

fs.writeFileSync(__dirname + '/../../generated/addresses.ts', genTs.join('\n'));
