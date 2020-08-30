'use strict'

const github = require('@actions/github')
const path = require('path')
const packageJson = require(path.join(process.cwd(), 'package.json'))

function getConfig (options, env, context) {
  const { npmToken, notifier, githubToken, npmUser, versionUrl } = options
  const repoName = env.REPO_NAME || context?.payload?.repository?.full_name
  const repoUrl = env.REPO_URL || context?.payload?.repository?.html_url
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
    githubContext: context,
    octokit
  }
}

module.exports = {
  getConfig
}
