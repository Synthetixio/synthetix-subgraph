#!/bin/bash
network=$1
subgraph=$2
token=$THEGRAPH_SNX_ACCESS_TOKEN
networks='mainnet optimism kovan optimism-kovan optimism-local'

GRAPH=${GRAPH:-graph}

if [ "all" == $network ]; then
    for i in $networks; do
        echo "deploying subgraph: $subgraph, to network: $i"
        SNX_NETWORK=$i $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token $THEGRAPH_SNX_ACCESS_TOKEN synthetixio-team/$i-$subgraph subgraphs/$subgraph.js
    done
else
    SNX_NETWORK=$network npx $GRAPH deploy --node $GRAPH_NODE_URL --ipfs $IPFS_NODE_URL --access-token $token synthetixio-team/$network-$subgraph subgraphs/$subgraph.js
fi