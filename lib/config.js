'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const path = require('path')
const packageJson = require(path.join(process.cwd(), 'package.json'))

const NPM_TOKEN = process.env.NPM_TOKEN || core.getInput('npm_token')
const NOTIFIER = process.env.NOTIFIER || core.getInput('notifier') || 'console'
const githubToken = process.env.GITHUB_TOKEN || core.getInput('github_token')

const NPM_USER = process.env.NPM_USER || core.getInput('npm_user')
const context = github.context
const versionUrl = process.env.VERSION_URL || core.getInput('version_url')
const repoName = process.env.REPO_NAME || context?.payload?.repository?.full_name
const repoUrl = process.env.REPO_URL || context?.payload?.repository?.html_url

const templateContext = {
  npm_user: NPM_USER,
  repo: {
    url: repoUrl,
    name: repoName
  },
  version: {
    url: versionUrl,
    name: packageJson.version
  }
}

module.exports = {
  NPM_TOKEN, NOTIFIER, githubToken, templateContext, githubContext: context
}
