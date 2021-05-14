#!/bin/bash
network=$1
subgraph=$2
token=$THEGRAPH_SNX_ACCESS_TOKEN
networks='mainnet optimism kovan optimism-kovan'

GRAPH=${GRAPH:-graph}

if [ "all" == $network ]; then
    for i in $networks; do
        echo "deploying subgraph: $subgraph, to network: $i"
        SNX_NETWORK=$i $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token $token synthetixio-team/$subgraph-$i subgraphs/$subgraph.js
    done
else
    SNX_NETWORK=$network $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token $token synthetixio-team/$subgraph-$network subgraphs/$subgraph.js
fi