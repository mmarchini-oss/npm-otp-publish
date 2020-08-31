'use strict'

const { Octokit } = require('@octokit/rest')
const path = require('path')
// TODO(mmarchini): allow custom package.json path
const packageJson = require(path.join(process.cwd(), 'package.json'))

function getConfig (options) {
  const {
    npmToken,
    notifier,
    githubToken,
    npmUser,
    versionUrl,
    repoName,
    timeout
  } = options
  const [owner, repo] =
    repoName ? repoName.split(/\/(.*)/) : [undefined, undefined]
  // TODO(mmarchini): custom domain so it also works on GitHub Enterprise
  const repoUrl = repoName ? `https://github.com/${repoName}` : undefined

  const version = {
    url: versionUrl,
    name: packageJson.version
  }
  const templateContext = {
    npm_user: npmUser,
    repo: {
      url: repoUrl,
      name: repoName
    },
    version
  }
  const octokit = githubToken ? new Octokit({ auth: githubToken }) : null

  return {
    npmToken,
    notifier,
    githubToken,
    templateContext,
    repo: {
      owner,
      repo
    },
    version,
    octokit,
    timeout: (timeout ? parseInt(timeout.toString()) : 15) * 60 * 1000
  }
}

module.exports = {
  getConfig
}
