#!/usr/bin/env node
'use strict'

const fastify = require('fastify')
const ngrok = require('ngrok')
const path = require('path')

const { getOptions } = require('../lib/cli')
const { getConfig } = require('../lib/config')
const { NpmPublish } = require('../lib/npm-publish')
const { Notifier } = require('../lib/notifier')

async function main () {
  let options
  try {
    options = await getOptions(process.argv, process.env)
  } catch (err) {
    if (err.output) {
      console.error(err.output)
    } else {
      throw err
    }
    return process.exit(1)
  }

  const config = getConfig(options)
  const app = fastify({
    // TODO(mmarchini): custom logger transport for Actions
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
  app.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
  })
  app.register(require('fastify-cors'), { })

  app.get('/', (request, reply) => {
    return reply.view('/public/index.ejs', config.templateContext)
  })

  let serverTimeout
  function closeServer (timeoutReached = false) {
    if (timeoutReached) {
      app.log.error('timeout reached, closing server')
    }
    if (serverTimeout) {
      clearTimeout(serverTimeout)
    }
    // We need this to execute ASAP, so this function can't be async
    npmPublish.end()
    // In case some of the closing methods fail, we force-exit
    setTimeout(() => process.exit(0), 5 * 1000)
    const cb = err => {
      if (err) {
        app.log.error(err)
      }
      setTimeout(() => {
        app.log.info('closing server')
        app.close()
      }, 1000)
    }
    notifier.end().then(cb, cb)
  }
  setTimeout(closeServer, config.timeout || 5 * 1000)
  app.log.info({ timeout: config.timeout }, 'timeout set')

  app.post('/', async (request, reply) => {
    try {
      app.log.error('otp received, attempting to publish')
      const published = await npmPublish.publish(request.body.otp)
      app.log.error('attempt finished')
      if (published) {
        app.log.error('publish successful')
        closeServer()

        return reply.view('/public/success.ejs', config.templateContext)
      }

      // TODO(mmarchini): limit attempts
      app.log.error('publish failed')
      return reply.view('/public/failure.ejs', { error: 'npm' })
    } catch (err) {
      app.log.error('publish failed for unknown reasons')
      if (err.stdout || err.stderr) {
        app.log.error({ stdout: err.stdout, stderr: err.stderr }, err)
      } else {
        app.log.error(err)
      }
      return reply.view('/public/failure.ejs', { error: 'uknown', stack: err.stack })
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
