'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const fastify = require('fastify')
const path = require('path')
const ngrok = require('ngrok')

const { NpmPublish } = require('./lib/npm-publish')

const NPM_USER = process.env.NPM_USER || core.getInput('npm_user')
const context = github.context
const githubToken = process.env.GITHUB_TOKEN || core.getInput('github_token')
const versionUrl = process.env.VERSION_URL || core.getInput('version_url')
const octokit = githubToken ? github.getOctokit(githubToken) : null
const packageJson = require(path.join(process.cwd(), 'package.json'))
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
const app = fastify({
  logger: {
    prettyPrint: true
  }
})
const npmPublish = new NpmPublish(app.log)

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
app.post('/', async (request, reply) => {
  try {
    app.log.error('otp received, attempting to publish')
    const published = await npmPublish.publish(request.body.otp)
    app.log.error('attempt finished')
    if (published) {
      app.log.error('publish successful')
      // TODO(mmarchini): Close issue
      npmPublish.end()
      setTimeout(() => {
        app.log.error('closing server')
        app.close(() => process.exit(0))
      }, 100)
      // TODO(mmarchini): Redirect/link to GitHub or npm
      return reply.view('/public/success.ejs')
    }

    // TODO(mmarchini): limit attempts
    // TODO(mmarchini): limit time
    app.log.error('publish failed')
    // TODO(mmarchini): stderr on response
    return reply.view('/public/failure.ejs')
  } catch (err) {
    // TODO(mmarchini): limit attempts
    // TODO(mmarchini): limit time
    app.log.error('publish failed for unknown reasons')
    if (err.stdout || err.stderr) {
      app.log.error({ stdout: err.stdout, stderr: err.stderr }, err)
    } else {
      app.log.error(err)
    }
    // TODO(mmarchini): stderr on response
    return reply.view('/public/failure.ejs')
  }
})

app.listen(3000, async (err, address) => {
  if (err) throw err
  app.log.info(`server listening on ${address}`)

  const ngrokUrl = await ngrok.connect(3000)
  app.log.info({ ngrokUrl }, 'ngrok connected')
  if (octokit) {
    app.log.info(context, 'creating issue')
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

process.on('uncaughtException', (error) => {
  core.setFailed(error.message)
})
