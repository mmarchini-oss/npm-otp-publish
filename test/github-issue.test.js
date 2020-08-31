'use strict'

const tape = require('tape')
const test = require('tape-promise').default(tape)
const { GitHubIssueNotifier } = require('../lib/notifiers/github-issue')
const { Octokit } = require('@octokit/rest')
const nock = require('nock')

const mockLogger = {
  info: () => {},
  error: () => {},
  debug: () => {},
  warning: () => {},
  fatal: () => {}
}

test('getTitle', async t => {
  const config = {
    version: {
      name: 'v0.1.2'
    }
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.equal(notifier.getTitle(), 'Release v0.1.2 waiting for OTP to publish to npm')
  t.end()
})

test('getBody with versio only', async t => {
  const config = {
    version: {
      name: 'v0.1.2'
    }
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.equal(notifier.getBody('ngrok://foo'), `Please [provide an One-Time Password](ngrok://foo) to continue the
release for v0.1.2.


**OTP URL**: ngrok://foo`)
  t.end()
})

test('getBody with version and version url', async t => {
  const config = {
    version: {
      name: 'v0.1.2',
      url: 'github.com'
    }
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.equal(notifier.getBody('ngrok://foo'), `Please [provide an One-Time Password](ngrok://foo) to continue the
release for [v0.1.2](github.com).


**OTP URL**: ngrok://foo`)
  t.end()
})

test('getBody with everything', async t => {
  const config = {
    actor: 'me',
    version: {
      name: 'v0.1.2',
      url: 'github.com'
    }
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.equal(notifier.getBody('ngrok://foo'), `Please [provide an One-Time Password](ngrok://foo) to continue the
release for [v0.1.2](github.com).

**Requested by**: @me
**OTP URL**: ngrok://foo`)
  t.end()
})

test('getAssignees without actor or team', async t => {
  const config = { }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.deepEqual(notifier.getAssignees(), [])
  t.end()
})

test('getAssignees with actor but no team', async t => {
  const config = {
    actor: 'me'
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.deepEqual(notifier.getAssignees(), ['me'])
  t.end()
})

test('getAssignees with no actor but team', async t => {
  const config = {
    releaseTeam: 'team'
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.deepEqual(notifier.getAssignees(), ['team'])
  t.end()
})

test('getAssignees with actor and team', async t => {
  const config = {
    actor: 'me',
    releaseTeam: 'team'
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  t.deepEqual(notifier.getAssignees(), ['me', 'team'])
  t.end()
})

test('should create and close issue', async t => {
  const repo = 'xyz'
  const owner = 'acme'
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
  const config = {
    octokit,
    repo: {
      owner,
      repo
    },
    actor: 'me',
    releaseTeam: 'team/release',
    version: {
      name: 'v0.1.2'
    }
  }
  const notifier = new GitHubIssueNotifier(config, mockLogger)
  await notifier.notify()
  scope.done()

  await notifier.end()
  scope2.done()
  t.ok(true)
  t.end()
})
