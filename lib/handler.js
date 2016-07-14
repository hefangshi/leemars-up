'use strict';
const EventEmitter = require('events').EventEmitter;

class MsgHandler extends EventEmitter {
  constructor(id, persistentKeys = []) {
    super();
    this.id = id;
    this._changed = false;
    persistentKeys.push('id');
    this.persistentKeys = persistentKeys;
  }
  setApp(app) {
    this.app = app;
  }
  load(data) {
    this.persistentKeys.forEach(key => {
      this[key] = data[key];
    });
  }
  dump() {
    this._changed = false;
    return this.persistentKeys.reduce((acc, key) => {
      acc[key] = this[key];
      return acc;
    }, {});
  }
  emitChange() {
    this._changed = true;
  }
  hasChange() {
    return this._changed;
  }
  onMsg(msg) {
    if (!msg.header || !(msg.header.from && msg.header.type && msg.msg && msg.header.reply_to)) {
      return false;
    }
    msg.header.time = parseInt(msg.header.time, 10);
    msg.header.from = parseInt(msg.header.from, 10);
    msg.header.reply_to = parseInt(msg.header.reply_to, 10);
    this._onMsg(msg);
  }
}

module.exports = MsgHandler;
