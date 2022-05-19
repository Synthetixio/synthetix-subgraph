const { afterTests, prepareTests } = require('./scripts/testSetup');
const { execSync } = require('child_process');

const run = () => {
  prepareTests();
  // Providing the -v avoids making github request to check the version, (which leads to rate limit if run frequently enough)
  try {
    execSync('npx graph test -v 0.4.3', { stdio: 'inherit' });
  } catch {
    // error will be logged and script will exit, so no need to throw
  } finally {
    afterTests();
  }
};
run();
