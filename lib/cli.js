'use strict'

const path = require('path')
const { readFile } = require('fs').promises
const yargs = require('yargs')
const YAML = require('yaml')

const actionFile = path.join(process.cwd(), 'action.yml')

const choices = {
  notifier: ['console', 'github-issue']
}

async function getOptions (argv, env = {}) {
  const program = yargs()
  const { inputs } = YAML.parse(await readFile(actionFile, 'utf-8'))

  for (const [key, { description, default: d, required }] of Object.entries(inputs)) {
    program.option(key.replace(/_/, '-'), {
      describe: description,
      demandOption: required,
      default: d,
      choices: choices[key]
    })
  }

  // TODO(mmarchini): move this to CI specific file
  let defaultRepo
  if (env.GITHUB_ACTIONS && env.GITHUB_REPOSITORY) {
    defaultRepo = env.GITHUB_REPOSITORY
  }
  program.option('repo-name', {
    describe: 'repository name (owner/repo)',
    default: defaultRepo
  })
  program.check((argv, options) => {
    if (argv.notifier === 'github-issue') {
      if (!argv.githubToken) {
        throw new Error('--github-token is required with `github-issue` notifier')
      }
    }
    return true
  })

  return new Promise((resolve, reject) => {
    program.parse(argv, (err, args, output) => {
      if (err) {
        err.output = output
        return reject(err)
      }

      return resolve(args)
    })
  })
}

module.exports = {
  getOptions
}
