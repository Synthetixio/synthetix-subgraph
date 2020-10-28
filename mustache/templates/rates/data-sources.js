module.exports = [
  {
    name: 'ExchangeRates_v231',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 7626469,
    address: "'0xba34e436C9383aa8FA1e3659D2807ae040592498'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes4.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes4[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v240',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 8075694,
    address: "'0x5cBB53Ca85A9E52B593Baf8ae90282C4B3dB0b25'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes4.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes4[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v272',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 8120141,
    address: "'0x70C629875daDBE702489a5E1E3bAaE60e38924fa'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes4.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes4[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v210',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 8622895,
    address: "'0x99a46c42689720d9118ff7af7ce80c2a92fc4f97'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes32.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v213',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 8971442,
    address: "'0x565C9EB432f4AE9633e50e1213AB4f23D8f31f54'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes32.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v217',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 9123410,
    address: "'0xE95Ef4e7a04d2fB05cb625c62CA58da10112c605'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes32.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v219',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 9518289,
    address: "'0x9D7F70AF5DF5D5CC79780032d47a34615D1F1d77'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_bytes32.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates_v223',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 10364342,
    address: "'0xba727c69636491ecdfE3E6F64cBE9428aD371e48'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates_v2.23.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
  {
    name: 'ExchangeRates',
    mappingFile: '../src/rates-mapping.ts',
    startBlock: 10773070,
    address: "'0xba727c69636491ecdfE3E6F64cBE9428aD371e48'",
    abi: 'ExchangeRates',
    entities: ['RatesUpdated'],
    abis: [
      {
        name: 'ExchangeRates',
        path: '../abis/ExchangeRates.json',
      },
    ],
    events: [
      {
        event: 'RatesUpdated(bytes32[],uint256[])',
        handler: 'handleRatesUpdated',
      },
    ],
  },
];
