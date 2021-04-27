const { getContractDeployments, versions, getCurrentNetwork } = require('../utils/network');

const exchangeRatesContractAddresses = getContractDeployments('ExchangeRates');

const exchangeRatesManifests = [];

// the rates updated event changed from bytes4 to bytes32 in the sirius release
const BYTE32_UPDATE = versions.Sirius;
const POLLUX_UPDATE = versions.Pollux;
const ACRUX_UPDATE = versions.Acrux;

exchangeRatesContractAddresses.forEach((ca, i) => {
    exchangeRatesManifests.push(
        {
            "kind": "ethereum/contract",
            "name": `ExchangeRates_${i}`,
            "network": getCurrentNetwork(),
            "source": {
               "address": ca.address,
               "startBlock": ca.startBlock,
               "abi": "ExchangeRates",
            },
            "mapping": {
               "kind": "ethereum/events",
               "apiVersion": "0.0.4",
               "language": "wasm/assemblyscript",
               "file": "../src/fragments/latest-rates.ts",
               "entities": [
                 "RatesUpdated",
                 "AggregatorAddress"
               ],
               "abis": [
                  {
                     "name": "ExchangeRates",
                     "file": ca.startBlock >= BYTE32_UPDATE ? "../abis/ExchangeRates.json" : "../abis/ExchangeRates_bytes4.json"
                  }
               ],
               "eventHandlers": ((getCurrentNetwork() == 'mainnet' && ca.startBlock >= BYTE32_UPDATE) ? [
                  {
                     "event": "AggregatorAdded(bytes32,address)",
                     "handler": "handleAggregatorAdded"
                  },
                  {
                     "event": "RatesUpdated(bytes32[],uint256[])",
                     "handler": "handleRatesUpdated"
                  }
               ] : [
                  {
                     "event": "RatesUpdated(bytes4[],uint256[])",
                     "handler": "handleRatesUpdated"
                  }
               ])
            }
         }
      );
});

const aggregatorTemplate = {
   "kind": "ethereum/contract",
   "name": `Aggregator`,
   "network": getCurrentNetwork(),
   "source": {
       "abi": "Aggregator",
   },
   "mapping": {
       "kind": "ethereum/events",
       "apiVersion": "0.0.4",
       "language": "wasm/assemblyscript",
       "file": "../src/fragments/latest-rates.ts",
       "entities": [
           "LatestRates"
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
};

// separate aggregator for inverse synths
const inverseAggregatorTemplate = {
   "kind": "ethereum/contract",
   "name": `InverseAggregator`,
   "network": getCurrentNetwork(),
   "source": {
       "abi": "Aggregator",
   },
   "mapping": {
       "kind": "ethereum/events",
       "apiVersion": "0.0.4",
       "language": "wasm/assemblyscript",
       "file": "../src/fragments/latest-rates.ts",
       "entities": [
           "LatestRates"
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
               "handler": "handleInverseAggregatorAnswerUpdated"
           }
       ]
   }
};

module.exports = {
   dataSources: exchangeRatesManifests,
   templates: [aggregatorTemplate, inverseAggregatorTemplate]
};