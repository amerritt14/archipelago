/* global describe, it, after, before */

const { assert }  = require('chai')
const ConfigFile  = require('../app/config_file')
const { homedir } = require('os')
const { join }    = require('path')
const fs          = require('fs')
const CSON        = require('season')
const { app }     = require('electron')

describe('ConfigFile', () => {
  before(() => {
    this.filePath = join(homedir(), '.archipelago.dev.json')
    fs.unlink(this.filePath, () => {})
  })

  after(() => {
    fs.unlink(this.filePath, () => {})
  })

  describe('no config file exists', () => {
    it('creates a config file', () => {
      assert.isNull(CSON.resolve(this.filePath))
      new ConfigFile
      assert.isNotNull(CSON.resolve(this.filePath))
    })

    it('writes the current version', () => {
      const configFile = new ConfigFile
      assert.deepEqual(configFile.read(), { version: app.getVersion() })
    })
  })

  describe('update', () => {
    it('writes a field', () => {
      const configFile = new ConfigFile
      configFile.update('thing', 'field')

      assert.deepEqual(
        configFile.read(),
        { version: app.getVersion(), thing: 'field' }
      )
    })
  })

  describe('runs migrations', () => {
    before(() => {
      CSON.writeFileSync(this.filePath, {})
    })

    it('upgrades the version and runs migrations', () => {
      const currentContents = CSON.readFileSync(this.filePath)
      assert.deepEqual(currentContents, {})
      const configFile = new ConfigFile
      assert.deepEqual(configFile.read(), { version: app.getVersion() })
    })
  })
})