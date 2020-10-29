const createStartBlock = ({ prodStartBlock, testStartBlock }) =>
  process.env.TEST_YAML
    ? process.env.UNIVERSAL_START_BLOCK != 'null'
      ? process.env.UNIVERSAL_START_BLOCK
      : testStartBlock || prodStartBlock
    : prodStartBlock;

module.exports = {
  createStartBlock,
};
