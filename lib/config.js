'use strict'

const github = require('@actions/github')
const path = require('path')
const packageJson = require(path.join(process.cwd(), 'package.json'))

function getConfig (options) {
  const {
    npmToken,
    notifier,
    githubToken,
    npmUser,
    versionUrl,
    repoName
  } = options
  const [owner, repo] =
    repoName ? repoName.split(/\/(.*)/) : [undefined, undefined]
  // TODO(mmarchini): custom domain so it also works on GitHub Enterprise
  const repoUrl = repoName ? `https://github.com/${repoName}` : undefined
  const templateContext = {
    npm_user: npmUser,
    repo: {
      url: repoUrl,
      name: repoName
    },
    version: {
      url: versionUrl,
      name: packageJson.version
    }
  }
  const octokit = githubToken ? github.getOctokit(githubToken) : null

  return {
    npmToken,
    notifier,
    githubToken,
    templateContext,
    repo: {
      owner,
      repo
    },
    octokit
  }
}

module.exports = {
  getConfig
}
