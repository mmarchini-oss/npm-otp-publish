#!/usr/bin/env node
'use strict'

const fastify = require('fastify')
const ngrok = require('ngrok')
const { GITHUB_EVENT_PATH } = process.env
const context = GITHUB_EVENT_PATH ? require(GITHUB_EVENT_PATH) : {}

const { getOptions } = require('./lib/cli')
const { getConfig } = require('./lib/config')
const { NpmPublish } = require('./lib/npm-publish')
const { Notifier } = require('./lib/notifier')

async function main () {
  let options
  try {
    options = await getOptions(process.argv, process.env)
  } catch (err) {
    console.error(err.output)
    process.exit(1)
  }

  const config = getConfig(options)
  const app = fastify({
    logger: {
      prettyPrint: true
    }
  })
  const npmPublish = new NpmPublish(config, app.log)
  const notifier = new Notifier(config, app.log)

  app.register(require('fastify-formbody'))
  app.register(require('point-of-view'), {
    engine: {
      ejs: require('ejs')
    }
  })

  app.get('/', (request, reply) => {
    return reply.view('/public/index.ejs', config.templateContext)
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
        const cb = err => {
          if (err) {
            app.log.error(err)
          }
          setTimeout(() => {
            app.log.info('closing server')
            app.close(() => process.exit(0))
          }, 100)
        }
        notifier.end().then(cb, cb)

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

    app.log.info('starting ngrok...')
    const ngrokUrl = await ngrok.connect(3000)
    app.log.info({ ngrokUrl }, 'starting ngrok... done')

    app.log.info('notifying...')
    await notifier.notify(ngrokUrl)
    app.log.info('notifying... done')
  })
}

main()

process.on('unhandledRejection', err => {
  throw err
})
