const createStartBlock = ({ prod, test, universalTestBlock }) =>
  process.env.TEST_YAML ? universalTestBlock || test || prod : prod;

module.exports = {
  createStartBlock,
};
