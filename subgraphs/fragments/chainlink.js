const { getCurrentNetwork } = require('../utils/network');

const aggregatorTokenAddrs = require('../utils/aggregators/' + getCurrentNetwork());

// aggregators always follow the same pattern, so we can just generate them here
const aggregatorManifests = [];

for(const tok in aggregatorTokenAddrs) {

    aggregatorTokenAddrs[tok].forEach((addrInfo, i) => {
        aggregatorManifests.push({
            "kind": "ethereum/contract",
            "name": `Aggregator${tok}_${i}`,
            "network": getCurrentNetwork(),
            "source": {
                "address": addrInfo.address,
                "startBlock": addrInfo.startBlock,
                "abi": "Aggregator",
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/fragments/chainlink.ts",
                "entities": [
                    "AggregatorAnswer"
                ],
                "abis": [
                    {
                        "name": "Aggregator",
                        "file": "../abis/Aggregator.json"
                    },
                    {
                        "name": "ExchangeRates",
                        "file": "../abis/ExchangeRates.json"
                    },
                    {
                        "name": "AddressResolver",
                        "file": "../abis/AddressResolver.json"
                    }
                ],
                "eventHandlers": [
                    {
                        "event": "AnswerUpdated(indexed int256,indexed uint256,uint256)",
                        "handler": "handleAggregatorAnswerUpdated"
                    }
                ]
            }
        });
    });
}

module.exports = aggregatorManifests;