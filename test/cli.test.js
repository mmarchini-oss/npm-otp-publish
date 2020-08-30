'use strict'

const tape = require('tape')
const test = require('tape-promise').default(tape)
const { getOptions } = require('../lib/cli')

test('passing no arguments should fail', t => {
  t.plan(1)
  t.rejects(getOptions([]))
})

test('passing all arguments should succeed', async t => {
  const args = await getOptions([
    '--npm-user=user',
    '--npm-token=token1',
    '--github-token=token2',
    '--version-url=httpsurl',
    '--notifier=console'
  ])
  t.equal(args.npmUser, 'user')
  t.equal(args.npmToken, 'token1')
  t.equal(args.githubToken, 'token2')
  t.equal(args.versionUrl, 'httpsurl')
  t.equal(args.notifier, 'console')
})

test('passing invalid arguments to notifier should fail', t => {
  t.plan(1)
  t.rejects(getOptions([
    '--npm-user=user',
    '--npm-token=token1',
    '--github-token=token2',
    '--version-url=httpsurl',
    '--notifier=invalid'
  ]))
})
