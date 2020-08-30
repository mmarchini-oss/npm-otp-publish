'use strict'

const path = require('path')
const { readFile } = require('fs').promises
const yargs = require('yargs')
const YAML = require('yaml')

const defaultActionFile = path.join(process.cwd(), 'action.yml')

const choices = {
  notifier: ['console', 'github-issue']
}

async function getOptions (argv, actionFile = defaultActionFile) {
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
