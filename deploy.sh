#!/bin/bash
network=$1
subgraph=$2
token=$THEGRAPH_SNX_ACCESS_TOKEN_DAVID
networks='mainnet optimism-mainnet kovan optimism-kovan'

GRAPH=${GRAPH:-graph}

if [ "all" == $network ]; then
    for i in $networks; do
        echo "deploying subgraph: $subgraph, to network: $i"
        $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token $token dvd-schwrtz/test build/$i/subgraphs/$subgraph/subgraph.yaml
    done
else
    $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token $token dvd-schwrtz/test build/$network/subgraphs/$subgraph/subgraph.yaml
fi