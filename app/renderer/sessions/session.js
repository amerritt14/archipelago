import {clipboard, remote} from 'electron'
import ipc from 'electron-better-ipc'
import {activeWindow} from 'electron-util'
import {CompositeDisposable, Disposable} from 'event-kit'
import {Terminal} from 'xterm'
import unescape from 'unescape-js'
import keystrokeForKeyboardEvent from 'keystroke-for-keyboard-event'
import {xtermSettings, debouncer} from '../../common/config-file'

Terminal.applyAddon(require('xterm/lib/addons/fit/fit'))
Terminal.applyAddon(require('xterm/lib/addons/search/search'))

export default class Session {
  constructor(type, branch) {
    this.branch = branch
    this.profileManager = remote.getGlobal('profileManager')
    this.id = Math.random()
    this.subscriptions = new CompositeDisposable()
    this.title = ''
    this.ptyId = ipc.callMain('pty-create', {sessionId: this.id, sessionWindowId: activeWindow().id})
    this.type = type || 'default'
    this.xterm = new Terminal(this.settings())

    this.bindDataListeners()
  }

  get className() {
    return 'Session'
  }

  get keymaps() {
    if (this._keymaps) {
      return this._keymaps
    }

    this._keymaps =
      this.profileManager.get('keybindings').reduce((result, item) => {
        result[item.keystroke] = unescape(item.command)
        return result
      }, {})

    return this._keymaps
  }

  settings() {
    return this.applySettingModifiers(
      xtermSettings.reduce((settings, property) => {
        settings[property] = this.profileManager.get(property)
        return settings
      }, {})
    )
  }

  applySettingModifiers(defaultSettings) {
    if (this.type === 'visor') {
      defaultSettings.allowTransparency = this.profileManager.get('visor.allowTransparency')
      defaultSettings.theme.background = this.profileManager.get('visor.background')
    }

    return defaultSettings
  }

  resetTheme() {
    this.xterm.setOption('theme', this.settings().theme)
  }

  async kill() {
    this.subscriptions.dispose()
    this.xterm.dispose()

    const ptyId = await this.ptyId

    await ipc.callMain('pty-kill', ptyId)
  }

  fit() {
    debouncer(() => {
      this.xterm.fit()
      ipc.callMain(`pty-resize-${this.id}`, {cols: this.xterm.cols, rows: this.xterm.rows})
    }, 200)()
  }

  searchNext(query, options) {
    this.xterm.findNext(query, options)
  }

  searchPrevious(query, options) {
    this.xterm.findPrevious(query, options)
  }

  keybindingHandler(e) {
    let caught = false
    const mapping = this.keymaps[keystrokeForKeyboardEvent(e)]

    if (mapping) {
      ipc.callMain(`pty-write-${this.id}`, mapping)
      caught = true
    }

    return !caught
  }

  bindScrollListener() {
    const scrollbarFadeEffect = () => {
      clearTimeout(this.scrollbarFade)
      this.scrollbarFade = setTimeout(
        () => this.xterm.element.classList.remove('scrolling'),
        600
      )
      this.xterm.element.classList.add('scrolling')
    }

    this.xterm.element.addEventListener('wheel', scrollbarFadeEffect.bind(this), {passive: true})

    return new Disposable(() => {
      this.xterm.element.removeEventListener('wheel', scrollbarFadeEffect.bind(this), {passive: true})
    })
  }

  setTitle(title) {
    this.title = title
  }

  resetBlink() {
    ipc.callMain('cursor-blink').then(cursorBlink => {
      if (cursorBlink) {
        this.xterm.setOption('cursorBlink', false)
        this.xterm.setOption('cursorBlink', true)
      }
    })
  }

  copySelection() {
    ipc.callMain('copy-on-select').then(copyOnSelect => {
      if (copyOnSelect) {
        clipboard.writeText(this.xterm.getSelection())
      }
    })
  }

  onFocus(callback) {
    return this.xterm.addDisposableListener('focus', callback)
  }

  onTitle(callback) {
    return this.xterm.addDisposableListener('title', callback)
  }

  onExit(callback) {
    ipc.answerMain(`pty-exit-${this.id}`, callback)
  }

  onData(callback) {
    return this.xterm.addDisposableListener('data', callback)
  }

  onSelection(callback) {
    return this.xterm.addDisposableListener('selection', callback)
  }

  bindDataListeners() {
    this.xterm.attachCustomKeyEventHandler(this.keybindingHandler.bind(this))

    ipc.answerMain(`pty-data-${this.id}`, data => this.xterm.write(data))
    this.subscriptions.add(this.onData(data => {
      ipc.callMain(`pty-write-${this.id}`, data)
    }))
    this.subscriptions.add(this.onTitle(title => this.setTitle(title)))
    this.subscriptions.add(this.onFocus(this.fit.bind(this)))
    this.subscriptions.add(this.onFocus(this.resetBlink.bind(this)))
    this.subscriptions.add(this.onSelection(this.copySelection.bind(this)))

    ipc.answerMain('setting-changed', ({property, value}) => {
      if (xtermSettings.indexOf(property) >= 0) {
        this.xterm.setOption(property, value)
      }
    })
  }
}
