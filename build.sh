#!/bin/bash
network=$1
subgraph=$2
networks='mainnet optimism kovan optimism-kovan optimism-local'

GRAPH=${GRAPH:-graph}

# only need to run the same codegen once for all networks
SNX_NETWORK=mainnet SUBGRAPH=$subgraph $GRAPH codegen subgraphs/rates.js -o generated/subgraphs/rates
SNX_NETWORK=mainnet SUBGRAPH=$subgraph $GRAPH codegen subgraphs/$subgraph.js -o generated/subgraphs/$subgraph

if [ "general" == $subgraph ]; then
    node ./create-escrow-contracts
fi

if [[ $subgraph != "rates" && -d generated/subgraphs/$subgraph/ChainlinkMultisig ]]
then
    mv generated/subgraphs/$subgraph/ChainlinkMultisig generated/subgraphs/rates/ChainlinkMultisig
fi

if [ "all" == $network ]; then
    for i in $networks; do
	echo "building $subgraph $i"
        SNX_NETWORK=$i SUBGRAPH=$subgraph $GRAPH build subgraphs/$subgraph.js -o build/$i/subgraphs/$subgraph
    done
else
    echo "building $subgraph $network"
    SNX_NETWORK=$network SUBGRAPH=$subgraph $GRAPH build subgraphs/$subgraph.js -o build/$network/subgraphs/$subgraph
fi
