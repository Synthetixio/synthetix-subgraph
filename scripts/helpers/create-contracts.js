/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');

try {
  fs.mkdirSync(__dirname + '../../generated/');
} catch {}

const genTs = ['export const versions = {'];

for (const network of ['mainnet', 'mainnet-ovm', 'kovan', 'kovan-ovm']) {
  const versions = require(`synthetix/publish/deployed/${network}/versions.json`);

  genTs.push(`'${network}': ${JSON.stringify(versions)},`);
}

genTs.push('};');

genTs.push(`

export function getContractDeployments(contractName, network: string, startBlock: number = 0, endBlock: number = Number.MAX_VALUE) {
    startBlock = Math.max(startBlock, process.env['SNX_START_BLOCK'] || 0);
  
    const versionInfo = versions[network];
  
    const addressInfo = [];
  
    let prevInfo = null;
  
    // search for contract deployments
    for (const info of values(versionInfo)) {
      const contractInfo = info.contracts[contractName];
      if (contractInfo) {
        if ((network || getCurrentNetwork()).match('optimism') != null) {
          addressInfo.push({
            address: contractInfo.address,
            // with the regenesis, assume all contracts are basically deployed on the first block (doesn't hurt anything if they were deployed later)
            startBlock: 0,
          });
        }
        else {
  
          const theBlock = Math.max(info.block || estimateBlock(info.date), BLOCK_SAFETY_OFFSET);
  
          if (theBlock < startBlock) {
            prevInfo = { address: contractInfo.address, startBlock };
            continue;
          }
    
          if (prevInfo) {
            addressInfo.push(prevInfo);
            prevInfo = null;
          }
    
          if (theBlock >= endBlock) break;
    
          if (addressInfo.length) last(addressInfo).endBlock = theBlock + BLOCK_SAFETY_OFFSET;
    
          const cushionStartBlock =
            theBlock - BLOCK_SAFETY_OFFSET * 2 > 0 ? theBlock - BLOCK_SAFETY_OFFSET * 2 : theBlock - BLOCK_SAFETY_OFFSET;
    
          addressInfo.push({
            address: contractInfo.address,
            startBlock: cushionStartBlock,
          });
        }
      }
    }
  
    return addressInfo;
}
`);

fs.writeFileSync(__dirname + `../../generated/addresses.ts`, genTs.join('\n'));
