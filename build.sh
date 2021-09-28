#!/bin/bash

set -e

op=$1
subgraph=$2
network=$3
team=$4

networks='mainnet optimism kovan optimism-kovan'

GRAPH=${GRAPH:-graph}

# only need to run the same codegen once for all networks

node ./codegen

all_subgraphs=$(ls subgraphs | grep .js)

echo "full list of subgraphs: $all_subgraphs
"

codegen_subgraph () {
    local subgraph=$1
    echo "codegen $subgraph"
    SNX_NETWORK=mainnet SUBGRAPH=$subgraph $GRAPH codegen subgraphs/$subgraph.js -o generated/subgraphs/$subgraph
}

build_subgraph () {
    local subgraph=$1
    if [ "$network" == "all" ]; then
        for i in $networks; do
            echo "building $subgraph $i"
            SNX_NETWORK=$i SUBGRAPH=$subgraph $GRAPH build subgraphs/$subgraph.js -o build/$i/subgraphs/$subgraph
        done
    else
        echo "building $subgraph $network"
        SNX_NETWORK=$network SUBGRAPH=$subgraph $GRAPH build subgraphs/$subgraph.js -o build/$network/subgraphs/$subgraph
    fi
}

deploy_subgraph () {
    local subgraph=$1
    if [ "$network" == "all" ]; then
        for i in $networks; do
            echo "deploy $subgraph $i"
             echo "SNX_NETWORK=$i $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ $team/$i-$subgraph subgraphs/$subgraph.js"
        done
    else
        echo "deploy $subgraph $network"
        echo "SNX_NETWORK=$network $GRAPH deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ $team/$network-$subgraph subgraphs/$subgraph.js"
    fi
}

if [ "$op" == "deploy" ]; then
    $GRAPH auth --product hosted-service https://api.thegraph.com/deploy/ $GRAPH_TOKEN
fi

codegen_subgraph balances
codegen_subgraph latest-rates

if [ "$subgraph" == "all" ]; then
    for s in $all_subgraphs; do
        codegen_subgraph ${s%.js}
        ${op}_subgraph ${s%.js}
    done
else
    ${op}_subgraph $subgraph
fi