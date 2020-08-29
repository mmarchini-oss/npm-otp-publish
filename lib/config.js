'use strict'

const core = require('@actions/core')

const NPM_TOKEN = process.env.NPM_TOKEN || core.getInput('npm_token')

module.exports = {
  NPM_TOKEN
}
