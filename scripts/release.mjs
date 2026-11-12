#!/usr/bin/env node
// Bumps the version, publishes to npm, pushes the release commit and its tag and
// creates the GitHub release, so npm, the git tags and GitHub never drift apart.
//
//   npm run release -- patch|minor|major|<x.y.z>
//
// If the publish fails, the version commit and tag are undone, so nothing is left
// tagged that isn't on npm.
import { spawnSync } from 'node:child_process';

const bump = process.argv[2];
if (!bump || !/^(patch|minor|major|\d+\.\d+\.\d+(-[\w.]+)?)$/.test(bump)) {
  fail('usage: npm run release -- patch|minor|major|<x.y.z>');
}

const out = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) fail(`${cmd} ${args.join(' ')} failed:\n${r.stderr}`);
  return r.stdout.trim();
};
const run = (cmd, args) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' }).status === 0;

// Preconditions: clean tree, on main, level with origin, logged in to npm and gh.
if (out('git', ['status', '--porcelain'])) fail('the working tree is not clean');
const branch = out('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'main') fail(`releases are cut from main, not ${branch}`);
out('git', ['fetch', 'origin', 'main', '--tags']);
if (out('git', ['rev-parse', 'HEAD']) !== out('git', ['rev-parse', 'origin/main'])) {
  fail('main is not level with origin/main; pull or push first');
}
out('npm', ['whoami']);
out('gh', ['auth', 'status']);

// Check before bumping, so a red build never leaves a version commit behind.
if (!run('npm', ['run', 'typecheck']) || !run('npm', ['test']) || !run('npm', ['run', 'build'])) {
  fail('checks failed; nothing was released');
}

// Bump package.json and the lockfile, commit "chore(release): x.y.z" and tag vx.y.z.
if (!run('npm', ['version', bump, '-m', 'chore(release): %s'])) fail('npm version failed');
const version = out('node', ['-p', "require('./package.json').version"]);
const tag = `v${version}`;

// The checks already ran above, so skip prepublishOnly rather than run them twice.
if (!run('npm', ['publish', '--ignore-scripts'])) {
  out('git', ['tag', '-d', tag]);
  out('git', ['reset', '--hard', 'HEAD~1']);
  fail(`npm publish failed; removed ${tag} and the version commit`);
}

if (!run('git', ['push', '--atomic', 'origin', 'main', tag])) {
  fail(`${version} is on npm, but the push failed. Run: git push --atomic origin main ${tag}`);
}

const ghRelease = ['release', 'create', tag, '--verify-tag', '--title', tag, '--generate-notes'];
if (!run('gh', ghRelease)) {
  fail(`${version} is on npm and ${tag} is pushed, but the GitHub release failed. Run: gh ${ghRelease.join(' ')}`);
}

console.log(`\nReleased ${version}: published to npm, pushed ${tag} and created the GitHub release.`);

function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}
