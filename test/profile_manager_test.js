/* global describe, it, before, after */

const { assert }     = require('chai')
const ProfileManager = require('../app/profile_manager')
const Profile        = require('../app/profile')
const ConfigFile     = require('../app/config_file')
const { homedir }    = require('os')
const { join }       = require('path')
const fs             = require('fs')
const CSON           = require('season')

describe('ProfileManager', () => {
  before(() => {
    this.filePath = join(homedir(), '.archipelago.dev.json')
    fs.unlink(this.filePath, () => {})
  })

  after(() => {
    fs.unlink(this.filePath, () => {})
  })

  describe('all', () => {
    it('grabs all profiles', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)

      assert.equal(manager.all().length, 2)
    })

    it('doesnt error when no config file initially exists', () => {
      const configFile = new ConfigFile
      const manager = new ProfileManager(configFile)

      assert.equal(manager.all().length, 0)
    })
  })

  describe('find', () => {
    it('grabs the given profile', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)

      const foundProfile = manager.find(1)

      assert.instanceOf(foundProfile, Profile)
      assert.equal(foundProfile.id, 1)
      assert.equal(foundProfile.name, 'Profile 1')
    })

    it('returns null when no profile is found', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)

      const foundProfile = manager.find(3)

      assert.isNull(foundProfile)
    })

    it('doesnt error when no config file initially exists', () => {
      const configFile = new ConfigFile
      const manager = new ProfileManager(configFile)

      const foundProfile = manager.find(1)

      assert.isNull(foundProfile)
    })
  })

  describe('activeProfile', () => {
    it('sets the active profile', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)

      assert.isNull(manager.activeProfile())

      assert.equal(manager.activeProfileId = 1, 1)

      assert.instanceOf(manager.activeProfile(), Profile)
      assert.equal(manager.activeProfile().id, 1)
      assert.equal(manager.activeProfile().name, 'Profile 1')
    })
  })

  describe('create', () => {
    it('saves a new profile', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)

      assert.equal(manager.create(), 3)

      assert.equal(manager.activeProfile().id, 3)
      assert.deepEqual(
        configFile.contents.profiles,
        {
          '1': { id: 1, name: 'Profile 1' },
          '2': { id: 2, name: 'Profile 2' },
          '3': { id: 3 }
        }
      )
    })
  })

  describe('validate', () => {
    it('creates a profile if none exist', () => {
      const configFile = new ConfigFile
      const manager = new ProfileManager(configFile)

      assert.equal(manager.profileIds, 0)
      assert.isNull(manager.activeProfile())

      manager.validate()

      assert.equal(manager.profileIds, 1)
      assert.isNotNull(manager.activeProfile())
    })

    it('does nothing if an activeProfile exists', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)
      manager.activeProfileId = 1

      assert.isNotNull(manager.activeProfile())
      assert.equal(manager.profileIds.length, 2)

      manager.validate()

      assert.equal(manager.profileIds.length, 2)
    })

    it('resets the activeProfile if it was deleted', () => {
      const configFile = new ConfigFile
      configFile.update('profiles', this.profiles)
      const manager = new ProfileManager(configFile)
      manager.activeProfileId = 3

      assert.isNull(manager.activeProfile())
      assert.equal(manager.profileIds.length, 2)

      manager.validate()

      assert.equal(manager.profileIds.length, 2)
      assert.isNotNull(manager.activeProfile())
      assert.equal(manager.activeProfile().id, 1)
    })
  })
})