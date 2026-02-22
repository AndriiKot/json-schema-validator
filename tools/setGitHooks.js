'use strict';

const { execSync } = require('node:child_process');

const setGitHooks = () => {
  try {
    console.log('🔧 Setting git hooks path...');
    execSync('git config core.hooksPath .git-hooks', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Failed to set Git hooks:', err.message);
  }
};

setGitHooks();

