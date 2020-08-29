'use strict'

const { githubToken } = require('./config')
const github = require('@actions/github')

module.exports.octokit = githubToken ? github.getOctokit(githubToken) : null
