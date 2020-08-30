'use strict'

const tape = require('tape')
const test = require('tape-promise').default(tape)
const { Octokit } = require('@octokit/rest')
const nock = require('nock')

const { Notifier } = require('../lib/notifier')
const { getOptions } = require('../lib/cli')
const { getConfig } = require('../lib/config')

const mockLogger = {
  info: () => {},
  error: () => {},
  debug: () => {},
  warning: () => {},
  fatal: () => {}
}

test('should create and close issue', async t => {
  const repo = 'xyz'
  const owner = 'acme1'
  const scope = nock('https://api.github.com', {
    reqheaders: {
      authorization: 'token ***'
    }
  }).post(`/repos/${owner}/${repo}/issues`)
    .reply(201, { number: 123 })
  const scope2 = nock('https://api.github.com', {
    reqheaders: {
      authorization: 'token ***'
    }
  }).patch(`/repos/${owner}/${repo}/issues/123`, { state: 'closed' })
    .reply(200)

  const octokit = new Octokit({ auth: '***' })
  const notifier = new Notifier({ notifier: 'github-issue', octokit, repo: { owner, repo } }, mockLogger)
  await notifier.notify()
  scope.done()

  await notifier.end()
  scope2.done()
  t.end()
})

test('should create and close issue on Actions', async t => {
  const repo = 'xyz'
  const owner = 'acme2'
  const scope = nock('https://api.github.com', {
    reqheaders: {
      authorization: 'token ***'
    }
  }).post(`/repos/${owner}/${repo}/issues`)
    .reply(201, { number: 123 })
  const scope2 = nock('https://api.github.com', {
    reqheaders: {
      authorization: 'token ***'
    }
  }).patch(`/repos/${owner}/${repo}/issues/123`, { state: 'closed' })
    .reply(200)

  // const config = { notifier: 'github-issue', octokit, repo: { owner, repo } }
  const env = { GITHUB_ACTIONS: true, GITHUB_REPOSITORY: `${owner}/${repo}` }
  const opts = await getOptions(['--githubToken=***', '--npmToken=***', '--notifier=github-issue'], env)
  const config = getConfig(opts)
  const notifier = new Notifier(config, mockLogger)
  await notifier.notify()
  scope.done()

  await notifier.end()
  scope2.done()
  t.end()
})
