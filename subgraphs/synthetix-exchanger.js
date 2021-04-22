const { clone } = require('_');

const { getContractDeployments } = require('../utils/network');
const { getCurrentNetwork } = require('./utils/network');

const aggregatorManifests = require('./fragments/chainlink');
const latestRatesManifests = require('./fragments/latest-rates');

const manifest = clone(aggregatorManifests);

// add exchanger events
for(const a, i of getContractDeployments('Exchanger')) {
    manifest.push(
        {
            "kind": "ethereum/contract",
            "name": `Exchanger_${i}`,
            "network": getCurrentNetwork(),
            "source": {
                "address": a.address,
                "startBlock": a.startBlock,
                "abi": "Exchanger",
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/exchanger.ts",
                "entities": [
                   "ExchangeEntrySettled",
                   "ExchangeEntryAppended",
                   "TemporaryExchangePartnerTracker"
                ],
                "abis": [
                   {
                      "name": "Exchanger",
                      "file": "../abis/Exchanger.json"
                   }
                ],
                "eventHandlers": [
                   {
                      "event": "ExchangeEntrySettled(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256,uint256)",
                      "handler": "handleExchangeEntrySettled"
                   },
                   {
                      "event": "ExchangeEntryAppended(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256)",
                      "handler": "handleExchangeEntryAppended"
                   }
                ]
             }
        }
    );
}

// add synthetix (only the new contracts)
for(const a, i of getContractDeployments('ProxyERC20')) {
    manifest.push(
        {
            "kind": "ethereum/contract",
            "name": `Synthetix_${i}`,
            "network": getCurrentNetwork(),
            "source": {
                "address": a.address,
                "startBlock": a.startBlock,
                "abi": "Synthetix",
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/exchanger.ts",
                "entities": [
                   "DailyExchangePartner",
                   "ExchangePartner",
                   "TemporaryExchangePartnerTracker"
                ],
                "abis": [
                   {
                      "name": "Synthetix",
                      "file": "../abis/Synthetix.json"
                   }
                ],
                "eventHandlers": [
                   {
                      "event": "ExchangeTracking(indexed bytes32,bytes32,uint256)",
                      "handler": "handleExchangeTracking"
                   }
                ]
            }
        }
    );
}

// for exchange rates, modify the handler for the latest rates handler which does most of the work for us
for(const lrm of clone(latestRatesManifests)) {
    lrm.mapping.file = '../src/exchanger.ts';
    manifest.push(lrm);
}

module.exports = manifest;