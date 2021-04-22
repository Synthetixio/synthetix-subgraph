const { values, last, sortedIndexBy } = require('lodash');

function getCurrentNetwork() {
    return process.env['SNX_NETWORK'];
}

function getReleaseInfo(file) {
    const net = getCurrentNetwork();

    switch(net) {
        case 'mainnet':
        case 'kovan':
            return require('synthetix/publish/deployed/' + net + '/' + file);
        case 'optimism-kovan':
        case 'optimism-mainnet':
            return require('synthetix/publish/deployed/' +  + '/' + file);
        default:
            throw Error('unknown network: ' + net);
    }
}

function estimateBlock(date) {
    const blockInfo = values(getReleaseInfo('versions'))
        .filter(v => v.block && v.date)
        .map(v => ([v.block, v.date]));

    const idx = sortedIndexBy(blockInfo, [0, date], v => v[1]);

    if(blockInfo[idx][1] === date) {
        return blockInfo[idx][0];
    }
    
    if(idx == 0) {
        return null;
    }

    const numDate = new Date(date).getTime();
    const beforeDate = new Date(blockInfo[idx - 1][1]).getTime();
    const afterDate = new Date(blockInfo[idx][1]).getTime();

    return blockInfo[idx - 1][0] + (blockInfo[idx][0] - blockInfo[idx - 1][0]) * (afterDate - beforeDate) / (numDate - beforeDate);
}

function getReleaseBlocks() {
    const versionInfo = getReleaseInfo('versions');

    const versionNameMap = {};

    for(const n in versionInfo) {
        const info = versionInfo[n];
        versions[info.release || info.tag] = info.block || estimateBlock(info.date);
    }

    return versionNameMap;
}

const versions = getReleaseBlocks();

function getContractDeployments(contractName, startBlock = 0, endBlock = Number.MAX_VALUE) {

    const aggregatorMatch = contractName.match(/^Aggregator(.*)$/);
    if(aggregatorMatch) {
        return require('./aggregators/' + getCurrentNetwork())[aggregatorMatch[1]];
    }

    const versionInfo = getReleaseInfo('versions');

    const addressInfo = [];

    // search for contract deployments
    for(const info of values(versionInfo)) {
        const contractInfo = info.contracts[contractName];
        if(contractInfo) {
            const theBlock = info.block || estimateBlock(info.date);
            if(theBlock < startBlock)
                continue;
            if(theBlock >= endBlock)
                break;

            if(addressInfo.length)
                last(addressInfo).endBlock = info.block || (estimateBlock(info.date) + 8640);

            addressInfo.push({
                address: contractInfo.address,
                startBlock: info.block || (estimateBlock(info.date) - 8640)
            });
        }
    }

    return addressInfo;
}

module.exports = {
    getCurrentNetwork,
    getReleaseInfo,
    versions,
    getContractDeployments
}