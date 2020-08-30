'use strict'

const tape = require('tape')
const test = require('tape-promise').default(tape)
const { Notifier } = require('../lib/notifier')
const { Octokit } = require('@octokit/rest')
const nock = require('nock')

const mockLogger = {
  info: () => {},
  error: () => {},
  debug: () => {},
  warning: () => {},
  fatal: () => {}
}

test('should create and close issue', async t => {
  const repo = 'xyz'
  const owner = 'acme'
  const scope = nock('https://api.github.com')
    .post(`/repos/${owner}/${repo}/issues`)
    .reply(201, { number: 123 })
  const scope2 = nock('https://api.github.com')
    .patch(`/repos/${owner}/${repo}/issues/123`, { state: 'closed' })
    .reply(200)

  const octokit = new Octokit('***')
  const notifier = new Notifier({ notifier: 'github-issue', octokit, repo: { owner, repo } }, mockLogger)
  await notifier.notify()
  scope.done()

  await notifier.end()
  scope2.done()
  t.end()
})
