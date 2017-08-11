'use strict';

const Pty          = require('node-pty')
const defaultShell = require('default-shell')
const XTerm        = require('xterm')
const Tab          = require(__dirname + '/tab');

class Terminal {
  constructor() {
    this._setPty();
    this._setXTerm();
    this._setTerminalElement();
  }

  open() {
    document.querySelector('body').appendChild(this.terminalElement);
    this.xterm.open(this.terminalElement, true);
    this._setDataListeners();
    this.xterm.element.classList['add']('fullscreen');
    this.tab = new Tab(this);
    this.tab.create();
    this.fit();
  }

  fit() {
    var rows = Math.floor(this.xterm.element.offsetHeight / 18);
    var cols = Math.floor(this.xterm.element.offsetWidth / 9);

    this.xterm.resize(cols, rows);
    this.pty.resize(cols, rows);
  }

  _setPty() {
    this.pty = Pty.spawn(defaultShell, [], {
      name: 'xterm-256color',
      cwd: process.env.PWD,
      env: process.env
    });
  }

  _setXTerm() {
    this.xterm = new XTerm({
      cursorBlink: true,
      // block | underline | bar
      cursorStyle: 'block',
      visualBell: true,
      popOnBell: true
    });
  }

  _setDataListeners() {
    this.xterm.on('data', (data) => {
      this.pty.write(data);
    });
    this.pty.on('data', (data) => {
      this.xterm.write(data)
    });
  }

  _setTerminalElement() {
    this.terminalElement = document.createElement('div');
    this.terminalElement.classList += 'qterminal';
    this.terminalElement.dataset['pid'] = this.pty.pid;
  }
};

module.exports = Terminal;
