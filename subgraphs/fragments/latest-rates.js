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
                 "RatesUpdated"
              ],
              "abis": [
                 {
                    "name": "ExchangeRates",
                    "file": ca.startBlock > BYTE32_UPDATE ? 
                              ca.startBlock === ACRUX_UPDATE ?
                                "../abis/ExchangeRates_v2.23.json" :
                                ca.startBlock >= POLLUX_UPDATE ?
                                  "../abis/ExchangeRates.json" :
                                "../abis/ExchangeRates_bytes32.json" :
                              "../abis/ExchangeRates_bytes4.json"
                 }
              ],
              "eventHandlers": [
                 {
                    "event": ca.startBlock > BYTE32_UPDATE ? "RatesUpdated(bytes32[],uint256[])" : "RatesUpdated(bytes4[],uint256[])",
                    "handler": "handleRatesUpdated"
                 }
              ]
           }
        }
    );
});

module.exports = exchangeRatesManifests;