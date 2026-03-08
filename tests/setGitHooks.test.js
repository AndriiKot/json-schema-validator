import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const childProcess = require('node:child_process');
const { setGitHooks } = require('../tools/setGitHooks.js');

test('setGitHooks runs git config command', () => {
  const originalExecSync = childProcess.execSync;

  let called = false;

  childProcess.execSync = (cmd) => {
    called = true;
    assert.equal(cmd, 'git config core.hooksPath .git-hooks');
  };

  setGitHooks();

  childProcess.execSync = originalExecSync;

  assert.equal(called, true);
});
