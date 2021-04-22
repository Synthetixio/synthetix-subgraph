const { getContractDeployments, getReleaseBlocks } = require('../utils/network');
const { getCurrentNetwork } = require('./utils/network');

const exchangeRatesContractAddresses = ;

const manifest = [];

if(getCurrentNetwork() == 'mainnet') {
    // pre-recording contracts
    manifest.push(
        {
            "kind": "ethereum/contract",
            "name": "Synthetix4_viaOldProxy",
            "network": "mainnet",
            "source": {
                "address": "0xc011a72400e58ecd99ee497cf89e3775d4bd732f",
                "abi": "Synthetix4",
                "startBlock": 6841188
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/exchanges.ts",
                "entities": [
                    "SynthExchange"
                ],
                "abis": [
                    {
                    "name": "Synthetix4",
                    "file": "../abis/Synthetix_bytes4.json"
                    }
                ],
                "eventHandlers": [
                    {
                    "event": "SynthExchange(indexed address,bytes4,uint256,bytes4,uint256,address)",
                    "handler": "handleSynthExchange4"
                    }
                ]
            }
        },
        {
            "kind": "ethereum/contract",
            "name": "Synthetix_viaOldProxy",
            "network": "mainnet",
            "source": {
                "address": "0xc011a72400e58ecd99ee497cf89e3775d4bd732f",
                "abi": "Synthetix",
                "startBlock": 8622911
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/exchanges.ts",
                "entities": [
                    "SynthExchange",
                    "ExchangeReclaim",
                    "ExchangeRebate"
                ],
                "abis": [
                    {
                    "name": "Synthetix4",
                    "file": "../abis/Synthetix_bytes4.json"
                    },
                    {
                    "name": "Synthetix32",
                    "file": "../abis/Synthetix_bytes32.json"
                    },
                    {
                    "name": "Synthetix",
                    "file": "../abis/Synthetix.json"
                    },
                    {
                    "name": "AddressResolver",
                    "file": "../abis/AddressResolver.json"
                    },
                    {
                    "name": "ExchangeRates",
                    "file": "../abis/ExchangeRates.json"
                    }
                ],
                "eventHandlers": [
                    {
                    "event": "SynthExchange(indexed address,bytes32,uint256,bytes32,uint256,address)",
                    "handler": "handleSynthExchange32"
                    },
                    {
                    "event": "ExchangeReclaim(indexed address,bytes32,uint256)",
                    "handler": "handleExchangeReclaim"
                    },
                    {
                    "event": "ExchangeRebate(indexed address,bytes32,uint256)",
                    "handler": "handleExchangeRebate"
                    }
                ]
            }
        }
    );
}

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
                "file": "../src/exchanges.ts",
                "entities": [
                    "SynthExchange",
                    "ExchangeReclaim",
                    "ExchangeRebate"
                ],
                "abis": [
                    {
                    "name": "Synthetix4",
                    "file": "../abis/Synthetix_bytes4.json"
                    },
                    {
                    "name": "Synthetix32",
                    "file": "../abis/Synthetix_bytes32.json"
                    },
                    {
                    "name": "Synthetix",
                    "file": "../abis/Synthetix.json"
                    },
                    {
                    "name": "AddressResolver",
                    "file": "../abis/AddressResolver.json"
                    },
                    {
                    "name": "ExchangeRates",
                    "file": "../abis/ExchangeRates.json"
                    }
                ],
                "eventHandlers": [
                    {
                    "event": "SynthExchange(indexed address,bytes32,uint256,bytes32,uint256,address)",
                    "handler": "handleSynthExchange32"
                    },
                    {
                    "event": "ExchangeReclaim(indexed address,bytes32,uint256)",
                    "handler": "handleExchangeReclaim"
                    },
                    {
                    "event": "ExchangeRebate(indexed address,bytes32,uint256)",
                    "handler": "handleExchangeRebate"
                    }
                ]
            }
        }
    );
}

module.exports = manifest;