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
    repoName,
    repoUrl
  } = options
  const [owner, repo] =
    repoName ? repoName.split(/\/(.*)/) : [undefined, undefined]
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
