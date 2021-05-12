#!/bin/bash
network=$1
subgraph=$2
networks=( mainnet optimism-mainnet kovan optimism-kovan )

if [ "all" == $network ]; then
    for i in "${networks[@]}"
    do
        graph deploy build/$i/$subgraph/subgraph.yaml
    done
else
    graph deploy build/$network/$subgraph/subgraph.yaml
fi