'use strict'

const fastq = require('fastq')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const { NPM_TOKEN } = require('./config')

class NpmPublish {
  constructor (log) {
    this.queue = fastq(this.tryToPublish.bind(this), 1)
    this.log = log
  }

  async _publish (otp) {
    this.log.info('running npm publish')
    this.log.debug({ otp })
    // TODO(mmarchini): custom npm publish command?
    await exec(`npm publish --token=${NPM_TOKEN} --otp=${otp}`)
    this.log.info('publish successful')
    return null
  }

  end () {
    this.queue.kill()
    this.queue.pause()
  }

  tryToPublish (otp, cb) {
    this.log.info('trying to publish... 1')
    this._publish(otp).then(cb, cb)
  }

  publish (otp) {
    this.log.info('pushing otp to publishing queue... 1')
    return new Promise((resolve, reject) => {
      this.log.info('pushing otp to publishing queue... 2')
      try {
        this.queue.push(otp, (err) => err ? resolve(false) : resolve(true))
        this.log.info('pushing otp to publishing queue... done')
      } catch (err) {
        reject(err)
        this.log.error(err, 'pushing otp to publishing queue... failed')
      }
    })
  }
}

module.exports = { NpmPublish }
