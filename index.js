// UMD wrapper to support both nodejs (8  +) and modern browser (with fetch)
// UMD via https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js
(function(root, factory) {
  /* eslint-disable-next-line no-undef */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    /* eslint-disable-next-line no-undef */
    define(['fetch'], function(b) {
      return (root.snxSubgraph = factory(b));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('node-fetch'));
  } else {
    // Browser globals
    root.snxData = factory(root.fetch);
  }
  /* eslint-disable-next-line no-undef */
})(typeof self !== 'undefined' ? self : this, function(fetch) {
  'use strict';

  const graph = {
    snx: 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix',
    exchanges: 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-exchanges',
    rates: 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-rates',
  };

  const PAGE_SIZE = 100; // graph limitation'

  const pageResults = ({ api, queryCreator, field }) => {
    const runner = ({ skip }) => {
      return fetch(api, { method: 'POST', body: queryCreator({ skip }) })
        .then(response => response.json())
        .then(json => {
          if (json.errors) {
            throw Error(JSON.stringify(json.errors));
          }
          const {
            data: { [field]: results },
          } = json;

          if (results.length < PAGE_SIZE) {
            return results;
          }

          return runner({ skip: skip + PAGE_SIZE }).then(newResults => results.concat(newResults));
        });
    };

    return runner({ skip: 0 });
  };

  const hexToAscii = str => {
    const hex = str.toString();
    let out = '';
    for (let n = 2; n < hex.length; n += 2) {
      const nextPair = hex.substr(n, 2);
      if (nextPair !== '00') {
        out += String.fromCharCode(parseInt(nextPair, 16));
      }
    }
    return out;
  };

  return {
    pageResults,
    exchanges: {
      /**
       * Get all exchanges since some timestamp
       * @param {timestampInSecs: Number} the
       */
      since({ timestampInSecs = Math.floor(Date.now() / 1e3) - 3600 * 24 /* default is 1 day ago */ } = {}) {
        return pageResults({
          api: graph.exchanges,
          field: 'synthExchanges',
          queryCreator: ({ skip }) =>
            `{"query":"{synthExchanges(first:${PAGE_SIZE},skip:${skip},orderBy:timestamp,orderDirection:desc,where:{timestamp_gt: ${timestampInSecs}}){id,from,gasPrice,from,fromAmount,fromAmountInUSD,fromCurrencyKey,toCurrencyKey,toAddress,toAmount,toAmountInUSD,feesInUSD,block,timestamp}}","variables":null}`,
        })
          .then(results =>
            results.map(
              ({
                gasPrice,
                timestamp,
                id,
                from,
                fromAmount,
                block,
                fromAmountInUSD,
                fromCurrencyKey,
                toAddress,
                toAmount,
                toAmountInUSD,
                toCurrencyKey,
                feesInUSD,
              }) => ({
                gasPrice: gasPrice / 1e9,
                block,
                timestamp: Number(timestamp * 1000),
                date: new Date(timestamp * 1000),
                hash: id.split('-')[0],
                fromAddress: from,
                fromAmount: fromAmount / 1e18, // shorthand way to convert wei into eth
                fromCurrencyKeyBytes: fromCurrencyKey,
                fromCurrencyKey: hexToAscii(fromCurrencyKey),
                fromAmountInUSD: fromAmountInUSD / 1e18,
                toAmount: toAmount / 1e18,
                toAmountInUSD: toAmountInUSD / 1e18,
                toCurrencyKeyBytes: toCurrencyKey,
                toCurrencyKey: hexToAscii(toCurrencyKey),
                toAddress,
                feesInUSD: feesInUSD / 1e18,
              }),
            ),
          )
          .catch(err => console.error(err));
      },
    },
  };
});
