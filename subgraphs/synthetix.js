const { getContractDeployments } = require('./utils/network');
const { getCurrentNetwork } = require('./utils/network');

const manifest = [];

/*if(getCurrentNetwork() == 'mainnet') {
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
                "file": "../src/synthetix-old.ts",
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
                "file": "../src/synthetix-old.ts",
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
}*/

getContractDeployments('ProxyERC20').forEach((a, i) => {
    manifest.push(
        {
            "kind": "ethereum/contract",
            "name": `Synthetix_${i}`,
            "network": getCurrentNetwork(),
            "source": {
              "address": a.address,
              "startBlock": a.startBlock,
              "abi": "Synthetix"
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/synthetix-old.ts",
                "entities": [
                   "Transfer"
                ],
                "abis": [
                   {
                      "name": "Synthetix",
                      "file": "../abis/Synthetix.json"
                   },
                   {
                      "name": "Synthetix4",
                      "file": "../abis/Synthetix_bytes4.json"
                   },
                   {
                      "name": "Synthetix32",
                      "file": "../abis/Synthetix_bytes32.json"
                   },
                   {
                      "name": "AddressResolver",
                      "file": "../abis/AddressResolver.json"
                   },
                   {
                      "name": "SynthetixState",
                      "file": "../abis/SynthetixState.json"
                   }
                ],
                "eventHandlers": [
                   {
                      "event": "Transfer(indexed address,indexed address,uint256)",
                      "handler": "handleTransferSNX"
                   }
                ]
            }
        }
    );
});

getContractDeployments('ProxyFeePool').forEach((a, i) => {
    manifest.push(
        {
            "kind": "ethereum/contract",
            "name": `FeePool_${i}`,
            "network": getCurrentNetwork(),
            "source": {
                "address": a.address,
                "startBlock": a.startBlock,
                "abi": "FeePool"
            },   
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/synthetix-old.ts",
                "entities": [
                    "FeesClaimed",
                    "SNXHolder"
                ],
                "abis": [
                    {
                        "name": "FeePool",
                        "file": "../abis/FeePool.json"
                    },
                    {
                        "name": "FeePoolv217",
                        "file": "../abis/FeePool_v2.17.json"
                    },
                    {
                        "name": "Synthetix4",
                        "file": "../abis/Synthetix_bytes4.json"
                    },
                    {
                        "name": "Synthetix32",
                        "file": "../abis/Synthetix_bytes32.json"
                    }
                ],
                "eventHandlers": [
                    {
                        "event": "FeesClaimed(address,uint256,uint256)",
                        "handler": "handleFeesClaimed"
                    }
                ]
            }
        }
    );
});

getContractDeployments('RewardEscrow').forEach((a, i) => {
    manifest.push(
        {
            "kind": "ethereum/contract",
            "name": `RewardEscrow_${i}`,
            "network": getCurrentNetwork(),
            "source": {
                "address": a.address,
                "startBlock": a.startBlock,
                "abi": "RewardEscrow"
            },
            "mapping": {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "file": "../src/synthetix-old.ts",
                "entities": [
                    "RewardEscrowHolder",
                    "SNXHolder"
                ],
                "abis": [
                    {
                        "name": "RewardEscrow",
                        "file": "../abis/RewardEscrow.json"
                    },
                    {
                        "name": "Synthetix",
                        "file": "../abis/Synthetix.json"
                    },
                    {
                        "name": "Synthetix4",
                        "file": "../abis/Synthetix_bytes4.json"
                    },
                    {
                        "name": "Synthetix32",
                        "file": "../abis/Synthetix_bytes32.json"
                    },
                    {
                        "name": "Synthetix32",
                        "file": "../abis/Synthetix_bytes32.json"
                    },
                    {
                        "name": "AddressResolver",
                        "file": "../abis/AddressResolver.json"
                    },
                    {
                        "name": "SynthetixState",
                        "file": "../abis/SynthetixState.json"
                    }
                ],
                "eventHandlers": [
                    {
                        "event": "VestingEntryCreated(indexed address,uint256,uint256)",
                        "handler": "handleRewardVestEvent"
                    },
                    {
                        "event": "Vested(indexed address,uint256,uint256)",
                        "handler": "handleRewardVestEvent"
                    }
                ]
            }
        }
    );
});

for(const token of ['sUSD', 'sETH', 'sBTC', 'iETH', 'iBTC']) {
    getContractDeployments('Proxy' + token).forEach((a, i) => {
        manifest.push(
            {
                "kind": "ethereum/contract",
                "name": `Synth${token}_${i}`,
                "network": getCurrentNetwork(),
                "source": {
                    "address": a.address,
                    "startBlock": a.startBlock,
                    "abi": "Synth"
                },
                "mapping": {
                    "kind": "ethereum/events",
                    "apiVersion": "0.0.4",
                    "language": "wasm/assemblyscript",
                    "file": "../src/synthetix-old.ts",
                    "entities": [
                       "Transfer",
                       "Issued",
                       "Burned"
                    ],
                    "abis": [
                       {
                          "name": "Synth",
                          "file": "../abis/Synth.json"
                       },
                       {
                          "name": "Synthetix",
                          "file": "../abis/Synthetix.json"
                       },
                       {
                          "name": "Synthetix4",
                          "file": "../abis/Synthetix_bytes4.json"
                       },
                       {
                          "name": "Synthetix32",
                          "file": "../abis/Synthetix_bytes32.json"
                       },
                       {
                          "name": "AddressResolver",
                          "file": "../abis/AddressResolver.json"
                       },
                       {
                          "name": "SynthetixState",
                          "file": "../abis/SynthetixState.json"
                       }
                    ],
                    "eventHandlers": [
                       {
                          "event": "Transfer(indexed address,indexed address,uint256)",
                          "handler": "handleTransferSynth"
                       },
                       {
                          "event": "Issued(indexed address,uint256)",
                          "handler": "handleIssuedSynths"
                       },
                       {
                          "event": "Burned(indexed address,uint256)",
                          "handler": "handleBurnedSynths"
                       }
                    ]
                }
            }
        );
    });
}

module.exports = {
    "specVersion": "0.0.2",
    "description": "Synthetix API",
    "repository": "https://github.com/Synthetixio/synthetix-subgraph",
    "schema": {
        "file": "./synthetix-old.graphql"
    },
    "dataSources": manifest
}