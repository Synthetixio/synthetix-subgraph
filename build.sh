#!/bin/bash
network=$1
subgraph=$2
networks=( mainnet optimism-mainnet kovan optimism-kovan )

if [ "all" == $network ]; then
    for i in "${networks[@]}"
    do
        SNX_NETWORK=$i graph codegen subgraphs/$subgraph.js -o generated/subgraphs/$subgraph
        SNX_NETWORK=$i graph build subgraphs/$subgraph.js -o build/$i/subgraphs/$subgraph
    done
else
    SNX_NETWORK=$network graph codegen subgraphs/$subgraph.js -o generated/subgraphs/$subgraph
    SNX_NETWORK=$network graph build subgraphs/$subgraph.js -o build/$network/subgraphs/$subgraph
fi