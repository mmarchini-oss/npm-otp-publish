'use strict'

const { test } = require('tape')
const { getConfig } = require('../lib/config')
const path = require('path')
const packageJson = require(path.join(process.cwd(), 'package.json'))

test('passing no arguments should fail', t => {
  t.plan(1)
  t.throws(getConfig)
})

test('passing empty arguments should return defaults', t => {
  t.plan(1)
  const config = getConfig({})

  const version = {
    url: undefined,
    name: packageJson.version
  }
  t.deepEqual(config, {
    npmToken: undefined,
    notifier: undefined,
    githubToken: undefined,
    templateContext: {
      npm_user: undefined,
      repo: {
        url: undefined,
        name: undefined
      },
      version
    },
    version,
    repo: {
      repo: undefined,
      owner: undefined
    },
    octokit: null,
    githubIssue: {
      actor: undefined,
      releaseTeam: undefined
    },
    timeout: 15 * 60 * 1000
  })
})

test('passing all arguments with env should succeed', async t => {
  const npmToken = 'a1'
  const notifier = 'a2'
  const githubToken = 'a3'
  const npmUser = 'a4'
  const versionUrl = 'a5'
  const repoName = 'a6/a9'

  const config = getConfig({
    npmToken,
    notifier,
    githubToken,
    npmUser,
    versionUrl,
    repoName,
    githubActor: 'me',
    githubReleaseTeam: 'team',
    timeout: 1
  })
  const version = {
    url: versionUrl,
    name: packageJson.version
  }

  t.plan(1)
  t.deepEqual(config, {
    npmToken,
    notifier,
    githubToken,
    templateContext: {
      npm_user: npmUser,
      repo: {
        url: `https://github.com/${repoName}`,
        name: repoName
      },
      version
    },
    repo: {
      repo: 'a9',
      owner: 'a6'
    },
    version,
    octokit: config.octokit,
    githubIssue: {
      actor: 'me',
      releaseTeam: 'team'
    },
    timeout: 60 * 1000
  })
})
