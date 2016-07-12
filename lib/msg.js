'use strict';

class MsgHandler {
  constructor(id, persistentKeys = []) {
    this.id = id;
    this.persistentKeys = persistentKeys;
  }
  load(data) {
    this.persistentKeys.forEach(key => {
      this[key] = data[key];
    });
  }
  dump() {
    return this.persistentKeys.reduce((acc, key) => {
      acc[key] = this[key];
      return acc;
    }, {});
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
