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
const context = github.context;
const githubToken = core.getInput('github_token');
const octokit = githubToken ? github.getOctokit(githubToken) : null;

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
  const queue = fastq(tryToPublish, 1)
  const app = fastify({
    logger: true
  })

  app.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    fix: '/'
  })
  app.register(require('fastify-formbody'))

  // TODO(mmarchini): CORS
  app.post('/', (request, reply) => {
    app.log.info('foo')
    queue.push({ otp: request.body.otp, log: app.log }, err => {
      if (err) {
        // TODO(mmarchini): limit attempts
        // TODO(mmarchini): limit time
        app.log.error({ stdout: err.stdout, stderr: err.stderr }, err)
        return reply.sendFile('failure.html')
      } else {
        queue.kill()
        queue.pause()
        setTimeout(() => {
          app.close()
        }, 100)
        return reply.sendFile('success.html')
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
      })
      app.log.info('issue created')
    }
    // TODO(mmarchini): create issue
  })
} catch (error) {
  core.setFailed(error.message)
}
