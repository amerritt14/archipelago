const {api, platform} = require('electron-util')
const {spawn} = require('node-pty')
const {Disposable} = require('event-kit')

const ProfileManager = require('../common/profile-manager')

module.exports =
class Pty {
  constructor(pref) {
    this.id = Math.random()
    this.profileManager = new ProfileManager(pref)
    this.pref = pref

    this.pty = spawn(
      this.shell,
      this.profileManager.get('shellArgs').split(','),
      this.sessionArgs
    )
  }

  get shell() {
    return this.profileManager.get('shell') ||
      process.env[platform({windows: 'COMSPEC', default: 'SHELL'})]
  }

  get sessionArgs() {
    return {
      name: 'xterm-256color',
      cwd: process.env.HOME,
      env: {
        LANG: (api.app.getLocale() || '') + '.UTF-8',
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        ...process.env
      }
    }
  }

  async kill() {
    await new Promise(resolve => {
      this.pty.removeAllListeners('data')
      this.pty.removeAllListeners('exit')
      this.pty.kill()
      this.pref.events.dispose()
      resolve()
    })
  }

  onExit(callback) {
    this.pty.on('exit', callback)

    return new Disposable(() => this.pty.removeListener('exit', callback))
  }

  onData(callback) {
    this.pty.on('data', callback)

    return new Disposable(() => this.pty.removeListener('data', callback))
  }

  resize(cols, rows) {
    this.pty.resize(cols, rows)
  }

  write(data) {
    this.pty.write(data)
  }
}