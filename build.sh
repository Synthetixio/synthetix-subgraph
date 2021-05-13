#!/bin/bash
network=$1
subgraph=$2
networks='mainnet optimism-mainnet kovan optimism-kovan'

GRAPH=${GRAPH:-graph}

# only need to run the same codegen once for all networks
SNX_NETWORK=mainnet $GRAPH codegen subgraphs/synthetix-rates.js -o generated/subgraphs/synthetix-rates
SNX_NETWORK=mainnet $GRAPH codegen subgraphs/$subgraph.js -o generated/subgraphs/$subgraph

if [[ -d generated/subgraphs/$subgraph/ChainlinkMultisig ]]
then
    mv generated/subgraphs/$subgraph/ChainlinkMultisig generated/subgraphs/synthetix-rates/ChainlinkMultisig
fi

if [ "all" == $network ]; then
    for i in $networks; do
	echo "building $subgraph $i"
        SNX_NETWORK=$i $GRAPH build subgraphs/$subgraph.js -o build/$i/subgraphs/$subgraph
    done
else
    echo "building $subgraph $network"
    SNX_NETWORK=$network $GRAPH build subgraphs/$subgraph.js -o build/$network/subgraphs/$subgraph
fi
