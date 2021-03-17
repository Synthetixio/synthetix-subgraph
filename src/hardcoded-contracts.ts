export let readProxyAdressResolver = '0x1Cb059b7e74fD21665968C908806143E744D5F30';

export let contractsToProxies = new Map<string, string>();

// TODO add new chainlink feeds here and put in a different file when the list gets bigger
// contractsToProxies.set(
//   '0x05cf62c4ba0ccea3da680f9a8744ac51116d6231', // AggregatorAUD
//   '0x77F9710E7d0A19669A13c055F62cd80d313dF022'
// );

export let escrowContracts = new Map<string, string>();

escrowContracts.set('escrow', '0x06c6d063896ac733673c4474e44d9268f2402a55');
escrowContracts.set('rewardEscrow', '0xd32138018210eda0028240638f35b70ecc0d8c22');
escrowContracts.set('rewardEscrowV2', '0x47ee58801c1ac44e54ff2651ae50525c5cfc66d0');