module.exports = network => `
specVersion: 0.0.2
description: Synthetix API
repository: https://github.com/Synthetixio/synthetix-subgraph
schema:
  file: ../graphql/synthetix.graphql
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
        - Synthetix
        - SNXTransfer
        - Issued
        - Burned
        - Issuer
        - SNXHolder
        - DebtSnapshot
        - RewardEscrowHolder
        - FeesClaimed
        - TotalActiveStaker
        - TotalDailyActiveStaker
        - ActiveStaker
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
    name: SynthsUSD_proxy
    network: ${network}
    source:
      address: '{{#SynthsUSD_proxy.address}}${network}{{/SynthsUSD_proxy.address}}'
      abi: Synth
      startBlock: {{#SynthsUSD_proxy.startBlock}}${network}{{/SynthsUSD_proxy.startBlock}}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      file: ../../src/mapping.ts
      entities:
        - Issued
        - Burned
        - ActiveStaker
        - TotalActiveStaker
        - TotalDailyActiveStaker
        - Synthetix
        - SNXHolder
        - DebtSnapshot
      abis:
        - name: Synth
          file: ../../abis/Synth.json
        - name: Synthetix
          file: ../../abis/Synthetix.json
        - name: AddressResolver
          file: ../../abis/AddressResolver.json
        - name: SynthetixState
          file: ../../abis/SynthetixState.json
        - name: ExchangeRates
          file: ../../abis/ExchangeRates.json
      eventHandlers:
        - event: Issued(indexed address,uint256)
          handler: handleIssuedSynths
        - event: Burned(indexed address,uint256)
          handler: handleBurnedSynths

  - kind: ethereum/contract
    name: RewardEscrow
    network: ${network}
    source:
      address: '{{#RewardEscrow.address}}${network}{{/RewardEscrow.address}}'
      abi: RewardEscrow
      startBlock: {{#RewardEscrow.startBlock}}${network}{{/RewardEscrow.startBlock}}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      file: ../../src/mapping.ts
      entities:
        - RewardEscrowHolder
        - SNXHolder
        - Synthetix
      abis:
        - name: RewardEscrow
          file: ../../abis/RewardEscrow.json
        - name: Synthetix
          file: ../../abis/Synthetix.json
        - name: AddressResolver
          file: ../../abis/AddressResolver.json
        - name: SynthetixState
          file: ../../abis/SynthetixState.json
      eventHandlers:
        - event: VestingEntryCreated(indexed address,uint256,uint256)
          handler: handleRewardVestEvent
        - event: Vested(indexed address,uint256,uint256)
          handler: handleRewardVestEvent

  - kind: ethereum/contract
    name: RewardEscrowV2
    network: ${network}
    source:
      address: '{{#RewardEscrowV2.address}}${network}{{/RewardEscrowV2.address}}'
      abi: RewardEscrowV2
      startBlock: {{#RewardEscrowV2.startBlock}}${network}{{/RewardEscrowV2.startBlock}}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      file: ../../src/mapping.ts
      entities:
        - RewardEscrowHolder
        - SNXHolder
        - Synthetix
      abis:
        - name: RewardEscrowV2
          file: ../../abis/RewardEscrowV2.json
        - name: Synthetix
          file: ../../abis/Synthetix.json
        - name: AddressResolver
          file: ../../abis/AddressResolver.json
        - name: SynthetixState
          file: ../../abis/SynthetixState.json
      eventHandlers:
        - event: VestingEntryCreated(indexed address,uint256,uint256,uint256,uint256)
          handler: handleRewardVestingEventCreatedV2
        - event: Vested(indexed address,uint256,uint256)
          handler: handleRewardVestEventV2

  - kind: ethereum/contract
    name: FeePool
    network: ${network}
    source:
      address: '{{#FeePool.address}}${network}{{/FeePool.address}}'
      abi: FeePool
      startBlock: {{#FeePool.startBlock}}${network}{{/FeePool.startBlock}}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      file: ../../src/mapping.ts
      entities:
        - FeesClaimed
        - SNXHolder
      abis:
        - name: FeePool
          file: ../../abis/FeePool.json
      eventHandlers:
        - event: FeesClaimed(address,uint256,uint256)
          handler: handleFeesClaimed
`;
