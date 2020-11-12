const createStartBlock = (blocks, env, universalTestBlock, useExchangerBlocks = false) => {
  if (env === 'test') {
    return universalTestBlock != null && universalTestBlock != 'null'
      ? universalTestBlock
      : useExchangerBlocks && blocks.exchanger
      ? blocks.exchanger.test
      : blocks.test || blocks.prod;
  } else if (env === 'prod') {
    return useExchangerBlocks && blocks.exchanger && blocks.exchanger.prod ? blocks.exchanger.prod : blocks.prod;
  } else {
    throw new Error('Invalid env for creating a yaml file');
  }
};

module.exports = {
  createStartBlock,
};
