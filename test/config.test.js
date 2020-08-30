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
  const config = getConfig({}, {}, {})
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
      version: {
        url: undefined,
        name: packageJson.version
      }
    },
    githubContext: {},
    octokit: null
  })
})

test('passing all arguments with env should succeed', async t => {
  const npmToken = 'a1'
  const notifier = 'a2'
  const githubToken = 'a3'
  const npmUser = 'a4'
  const versionUrl = 'a5'
  const repoName = 'a6'
  const repoUrl = 'a7'

  const config = getConfig({
    npmToken,
    notifier,
    githubToken,
    npmUser,
    versionUrl
  },
  {
    REPO_NAME: repoName,
    REPO_URL: repoUrl
  }, { })
  t.plan(1)
  t.deepEqual(config, {
    npmToken,
    notifier,
    githubToken,
    templateContext: {
      npm_user: npmUser,
      repo: {
        url: repoUrl,
        name: repoName
      },
      version: {
        url: versionUrl,
        name: packageJson.version
      }
    },
    githubContext: {},
    octokit: config.octokit
  })
})

test('passing all arguments with context should succeed', async t => {
  const npmToken = 'a1'
  const notifier = 'a2'
  const githubToken = 'a3'
  const npmUser = 'a4'
  const versionUrl = 'a5'
  const repoName = 'a6'
  const repoUrl = 'a7'

  const githubContext = {
    payload: {
      repository: {
        full_name: repoName,
        html_url: repoUrl

      }
    }
  }
  const config = getConfig({
    npmToken,
    notifier,
    githubToken,
    npmUser,
    versionUrl
  }, { }, githubContext)
  t.plan(1)
  t.deepEqual(config, {
    npmToken,
    notifier,
    githubToken,
    templateContext: {
      npm_user: npmUser,
      repo: {
        url: repoUrl,
        name: repoName
      },
      version: {
        url: versionUrl,
        name: packageJson.version
      }
    },
    githubContext,
    octokit: config.octokit
  })
})
