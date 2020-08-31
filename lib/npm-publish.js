'use strict'

const fastq = require('fastq')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

class NpmPublish {
  constructor ({ npmToken }, log) {
    this.queue = fastq(this.tryToPublish.bind(this), 1)
    this.log = log
    this.npmToken = npmToken
  }

  async _publish (otp) {
    this.log.info('running npm publish')
    this.log.debug({ otp })
    if (process.env._FORCE_SUCCESS) {
      // NOTE(mmarchini): intended only for local development
      return null
    }
    await exec(`npm publish --token=${this.npmToken} --otp=${otp}`)
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
