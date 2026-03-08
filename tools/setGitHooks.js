'use strict';

const childProcess = require('node:child_process');

const setGitHooks = () => {
  try {
    console.log('🔧 Setting git hooks path...');
    childProcess.execSync('git config core.hooksPath .git-hooks', {
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('⚠️ Failed to set Git hooks:', err.message);
  }
};

module.exports = { setGitHooks };

if (require.main === module) {
  setGitHooks();
}
