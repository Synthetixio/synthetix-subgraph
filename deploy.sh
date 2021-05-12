#!/bin/bash
network=$1
subgraph=$2
networks=( mainnet optimism-mainnet kovan optimism-kovan )

if [ "all" == $network ]; then
    for i in "${networks[@]}"
    do
	    for f in subgraphs/*.js
        do 
            graph deploy build/$i/${f%.js}/subgraph.yaml
        done
    done
elif [ "synthetix" == $subgraph ]; then
    graph deploy build/$network/subgraphs/$subgraph/subgraph.yaml
fi
    graph deploy build/$network/subgraphs/synthetix-$subgraph/subgraph.yaml