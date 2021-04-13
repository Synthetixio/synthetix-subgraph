module.exports = network => `
testing
network: ${network}
address: {{#Synthetix.address}}${network}{{/Synthetix.address}}
address: {{#Synthetix.startBlock}}${network}{{/Synthetix.startBlock}}
finish testing
`;
