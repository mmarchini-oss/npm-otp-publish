'use strict'

const core = require('@actions/core')
const github = require('@actions/github');
const fastify = require('fastify')
const fastq = require('fastq')
const path = require('path')
const ngrok = require('ngrok')
const { promisify } = require('util')
const { writeFile, unlink } = require('fs').promises
const exec = promisify(require('child_process').exec)

const NPMRC_PATH = path.join(process.cwd(), '.npmrc')
const NPM_TOKEN = process.env.NPM_TOKEN || core.getInput('npm_token')
const NPM_USER = process.env.NPM_USER || core.getInput('npm_user')
const context = github.context;
const githubToken = process.env.GITHUB_TOKEN || core.getInput('github_token');
const versionUrl = process.env.VERSION_URL || core.getInput('version_url');
const octokit = githubToken ? github.getOctokit(githubToken) : null;
const packageJson = require(path.join(process.cwd(), 'package.json'))

async function npmPublish (otp, log) {
  // TODO(mmarchini): take existing file into account
  try {
    log.info({ file: NPMRC_PATH }, 'creating file')
    writeFile(NPMRC_PATH, `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`)
    log.info({ file: NPMRC_PATH }, 'file created')

    log.info('publish attempt')
    log.debug({ otp })
    // TODO(mmarchini): custom npm publish command?
    // TODO(mmarchini): allow private repositories as well
    await exec(`npm publish --access public --otp ${otp}`)
    log.info('publish successful')
    return null
  } finally {
    log.info({ file: NPMRC_PATH }, 'cleaning up')
    await unlink(NPMRC_PATH)
    log.info({ file: NPMRC_PATH }, 'cleaned up')
  }
}

function tryToPublish ({ otp, log }, cb) {
  npmPublish(otp, log).then(cb, cb)
}

try {
  const templateContext = {
    npm_user: NPM_USER,
    repo: {
      url: 'https://github.com/mmarchini-oss/npm-otp-publish',
      name: 'mmarchini-oss/npm-otp-publish'
    },
    version: {
      url: versionUrl,
      name: packageJson.version
    },
  }
  const queue = fastq(tryToPublish, 1)
  const app = fastify({
    logger: true
  })

  app.register(require('fastify-formbody'))
  app.register(require('point-of-view'), {
    engine: {
      ejs: require('ejs')
    }
  })

  app.get('/', (request, reply) => {
    return reply.view('/public/index.ejs', templateContext)
  })

  // TODO(mmarchini): CORS
  app.post('/', (request, reply) => {
    app.log.info('foo')
    queue.push({ otp: request.body.otp, log: app.log }, err => {
      if (err) {
        // TODO(mmarchini): limit attempts
        // TODO(mmarchini): limit time
        app.log.error({ stdout: err.stdout, stderr: err.stderr }, err)
        // TODO(mmarchini): stderr on response
        return reply.view('/public/failure.ejs')
      } else {
        // TODO(mmarchini): Close issue
        queue.kill()
        queue.pause()
        setTimeout(() => {
          app.close(() => process.exit(0))
        }, 100)
        // TODO(mmarchini): Redirect/link to GitHub or npm
        return reply.view('/public/success.ejs')
      }
    })
  })

  app.listen(3000, async (err, address) => {
    if (err) throw err
    app.log.info(`server listening on ${address}`)

    const ngrokUrl = await ngrok.connect(3000)
    app.log.info({ ngrokUrl }, 'ngrok connected')
    if (octokit) {
      app.log.info('creating issue')
      await octokit.issues.create({
        ...context.repo,
        title: 'Provide OTP for release', // TODO(mmarchini): show version number
        body: ngrokUrl // TODO(mmarchini): add more info to the issue
        // TODO(mmarchini): Mention team
        // TODO(mmarchini): Update issue if exists (in case of rerun)
      })
      app.log.info('issue created')
    }
  })
} catch (error) {
  core.setFailed(error.message)
}
