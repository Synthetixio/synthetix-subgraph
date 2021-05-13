#!/bin/bash
network=$1
subgraph=$2
networks='mainnet optimism-mainnet kovan optimism-kovan'

GRAPH=${GRAPH:-graph}

if [ "all" == $network ]; then
    for i in $networks; do
        echo "deploying $i"
        $GRAPH deploy build/$i/$subgraph/subgraph.yaml
    done
else
    $GRAPH deploy build/$network/$subgraph/subgraph.yaml
fi
