'use strict'

const yargs = require('yargs')

async function getOptions (argv, env = {}) {
  const program = yargs()

  program.option('npm-user', {
    describe: 'npm user name',
    demandOption: false
  })
  program.option('version-url', {
    describe: 'version url',
    demandOption: false
  })
  program.option('npm-token', {
    describe: 'npm token',
    required: true
  })
  program.option('notifier', {
    describe: 'notifier to be used',
    required: true,
    default: 'github-issue',
    choices: ['console', 'github-issue']
  })
  program.option('timeout', {
    describe: 'timeout (in minutes) before the server closes',
    required: true,
    default: '15'
  })

  // GitHub Issue notifier options
  program.option('github-token', {
    describe: 'github token (required if notifier is github-issue)',
    required: false
  })
  program.option('github-actor', {
    describe: 'release team to assign the issue',
    required: false
  })
  program.option('github-release-team', {
    describe: 'release team to assign the issue',
    required: false,
    default: 'github-issue'
  })

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
      if (args.help) {
        err = new Error()
      }
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
