module.exports = network => `
specVersion: 0.0.2
description: Synthetix API
repository: https://github.com/Synthetixio/synthetix-subgraph
schema:
  file: ./synthetix.graphql
dataSources:
  - kind: ethereum/contract
  name: Synthetix
  network: ${network}
  source:
    address: '{{#Synthetix.address}}${network}{{/Synthetix.address}}'
    abi: Synthetix
    startBlock: {{#Synthetix.startBlock}}${network}{{/Synthetix.startBlock}}
  mapping:
    kind: ethereum/events
    apiVersion: 0.0.4
    language: wasm/assemblyscript
    file: ../../src/mapping.ts
    entities:
      - SNXTransfer
      - SNXHolder
      - Synthetix
      - ExchangePartner
      - DailyExchangePartner
      - SynthExchange
      - ExchangeReclaim
      - ExchangeRebate
    abis:
      - name: Synthetix
        file: ../../abis/Synthetix.json
      - name: AddressResolver
        file: ../../abis/AddressResolver.json
      - name: SynthetixState
        file: ../../abis/SynthetixState.json
      - name: Exchanger
        file: ../../abis/Exchanger.json
    eventHandlers:
      - event: Transfer(indexed address,indexed address,uint256)
        handler: handleTransferSNX
      - event: ExchangeTracking(indexed bytes32,bytes32,uint256)
        handler: handleExchangeTracking
      - event: SynthExchange(indexed address,bytes32,uint256,bytes32,uint256,address)
        handler: handleSynthExchange
      - event: ExchangeReclaim(indexed address,bytes32,uint256)
        handler: handleExchangeReclaim
      - event: ExchangeRebate(indexed address,bytes32,uint256)
        handler: handleExchangeRebate

  - kind: ethereum/contract
  name: Exchanger
  network: ${network}
  source:
    address: '0xe318E4618E5684668992935d7231Cb837a44E670'
    abi: Exchanger
    startBlock: 1
  mapping:
    kind: ethereum/events
    apiVersion: 0.0.4
    language: wasm/assemblyscript
    file: ./src/mapping.ts
    entities:
      - ExchangeEntrySettled
      - ExchangeEntryAppended
    abis:
      - name: Exchanger
        file: ./abis/Exchanger.json
    eventHandlers:
      - event: ExchangeEntrySettled(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256,uint256)
        handler: handleExchangeEntrySettled
      - event: ExchangeEntryAppended(indexed address,bytes32,uint256,bytes32,uint256,uint256,uint256,uint256)
        handler: handleExchangeEntryAppended


  - kind: ethereum/contract
  name: ExchangeRates
  network: ${network}
  source:
    address: '0x631E93A0fb06B5eC6d52c0A2D89a3f9672d6Ba64'
    abi: ExchangeRates
    startBlock: 1
  mapping:
    kind: ethereum/events
    apiVersion: 0.0.4
    language: wasm/assemblyscript
    file: ./src/mapping.ts
    entities:
      - RatesUpdated
    abis:
      - name: ExchangeRates
        file: ./abis/ExchangeRates.json
    eventHandlers:
      - event: RatesUpdated(bytes32[],uint256[])
        handler: handleRatesUpdated
`;