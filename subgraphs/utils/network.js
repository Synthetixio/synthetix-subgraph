const { values, last, sortedIndexBy } = require('lodash');

const BLOCK_SAFETY_OFFSET = 8640;

function getCurrentNetwork() {
  return process.env['SNX_NETWORK'] || 'mainnet';
}

function getCurrentSubgraph() {
  return process.env['SUBGRAPH'];
}

function getReleaseInfo(file, network = undefined) {
  const net = network || getCurrentNetwork();

  let info = null;
  if (net === 'mainnet' || net === 'kovan') {
    return require('synthetix/publish/deployed/' + net + '/' + file);
  } else if (net === 'optimism') {
    return require('synthetix/publish/deployed/mainnet-ovm/' + file);
  } else if (net === 'optimism-kovan') {
    return require('synthetix/publish/deployed/kovan-ovm/' + file);
  }

  return info;
}

function estimateBlock(date) {
  const blockInfo = values(getReleaseInfo('versions'))
    .filter((v) => v.block && v.date)
    .map((v) => [v.block, v.date]);

  // find the release immediately after the specified time
  const idx = sortedIndexBy(blockInfo, [0, date], (v) => v[1]);

  const numDate = new Date(date).getTime();

  if (idx == blockInfo.length) {
    if (blockInfo.length < 3) {
      return null;
    }

    // determine some semblance of block rate
    const rate =
      (blockInfo[blockInfo.length - 1][0] - blockInfo[blockInfo.length - 3][0]) /
      (new Date(blockInfo[blockInfo.length - 1][1]).getTime() - new Date(blockInfo[blockInfo.length - 3][1]).getTime());

    return Math.floor(
      blockInfo[blockInfo.length - 1][0] + rate * (numDate - new Date(blockInfo[blockInfo.length - 1][1]).getTime()),
    );
  }

  if (blockInfo[idx][1] === date) {
    return blockInfo[idx][0];
  }

  if (idx == 0) {
    return null;
  }

  const beforeDate = new Date(blockInfo[idx - 1][1]).getTime();
  const afterDate = new Date(blockInfo[idx][1]).getTime();

  return Math.floor(
    blockInfo[idx - 1][0] +
      ((blockInfo[idx][0] - blockInfo[idx - 1][0]) * (numDate - beforeDate)) / (afterDate - beforeDate),
  );
}

function getReleaseBlocks() {
  const versionInfo = getReleaseInfo('versions');

  const versionNameMap = {};

  for (const n in versionInfo) {
    const info = versionInfo[n];
    versionNameMap[info.release || info.tag] = info.block || estimateBlock(info.date);
  }

  return versionNameMap;
}

const versions = getReleaseBlocks();

function getContractDeployments(contractName, startBlock = 0, endBlock = Number.MAX_VALUE, network = undefined) {
  startBlock = Math.max(startBlock, process.env['SNX_START_BLOCK'] || 0);

  const versionInfo = getReleaseInfo('versions', network);

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
      } else {
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

const NETWORKS = ['mainnet', 'kovan', 'optimism-kovan', 'optimism'];

module.exports = {
  getCurrentNetwork,
  getReleaseInfo,
  estimateBlock,
  versions,
  getContractDeployments,
  NETWORKS,
  getCurrentSubgraph,
};
