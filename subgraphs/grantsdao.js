// not versioned, just regular json export for now
module.exports = {
  specVersion: '0.0.2',
  description: 'Synthetix GrantsDAO API',
  repository: 'https://github.com/Synthetixio/synthetix-subgraph',
  schema: {
    file: './grantsdao.graphql',
  },
  dataSources: [
    {
      kind: 'ethereum/contract',
      name: 'GrantsDAO',
      network: getCurrentNetwork(),
      source: {
        address: '0x86626e1bbbd0ce95ed52e0c5e19f371a6640b591',
        abi: 'GrantsDAO',
        startBlock: 9925334,
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.4',
        language: 'wasm/assemblyscript',
        file: '../src/grantsdao.ts',
        entities: ['Account', 'Member', 'Proposal', 'SystemInfo', 'Vote', 'Tribute'],
        abis: [
          {
            name: 'GrantsDAO',
            file: '../abis/GrantsDAO.json',
          },
        ],
        eventHandlers: [
          {
            event: 'NewProposal(address,uint256,uint256)',
            handler: 'handleNewProposal',
          },
          {
            event: 'VoteProposal(uint256,address,bool)',
            handler: 'handleVoteProposal',
          },
          {
            event: 'ExecuteProposal(address,uint256)',
            handler: 'handleExecuteProposal',
          },
          {
            event: 'DeleteProposal(uint256)',
            handler: 'handleDeleteProposal',
          },
        ],
        callHandlers: [
          {
            function: 'addCommunityMember(address)',
            handler: 'handleAddCommunityMember',
          },
          {
            function: 'removeCommunityMember(address,uint256[])',
            handler: 'handleRemoveCommunityMember',
          },
          {
            function: 'addTeamMember(address)',
            handler: 'handleAddTeamMember',
          },
          {
            function: 'removeTeamMember(address)',
            handler: 'handleRemoveTeamMember',
          },
          {
            function: 'updateToPass(uint256)',
            handler: 'handleUpdateToPass',
          },
          {
            function: 'updateToPass(uint256)',
            handler: 'handleUpdateToPass',
          },
        ],
      },
    },
  ],
};
