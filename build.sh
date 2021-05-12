#!/bin/bash
network=$1
subgraph=$2
networks=( mainnet optimism-mainnet kovan optimism-kovan )

if [ "all" == $network ]; then
    for i in "${networks[@]}"
    do
	    for f in subgraphs/*.js
        do 
            SNX_NETWORK=$i graph codegen $f -o generated/${f%.js}
            SNX_NETWORK=$i graph build $f -o build/$i/${f%.js}
        done
    done
elif [ "synthetix" == $subgraph ]; then
    SNX_NETWORK=$network graph codegen subgraphs/$subgraph.js -o generated/subgraphs/$subgraph.js
    SNX_NETWORK=$network graph build subgraphs/$subgraph.js -o build/$network/subgraphs/$subgraph.js
fi
    SNX_NETWORK=$network graph codegen subgraphs/synthetix-$subgraph.js -o generated/subgraphs/synthetix-$subgraph.js
    SNX_NETWORK=$network graph build subgraphs/synthetix-$subgraph.js -o build/$network/subgraphs/synthetix-$subgraph.js