'use strict';

const MsgHandler = require('./msg');
const debuglog = require('util').debuglog('uidmap');

class UidMapHandler extends MsgHandler {
  constructor(id, extraPersistentKeys = []) {
    super(id, ['uidmap'].concat(extraPersistentKeys));
    this.uidmap = {};
  }
  _onMsg(msg) {
    if (!this.uidmap[msg.header.from]) {
      debuglog(`new uidmap ${msg.from}: ${msg.baiduid}`);
      this.uidmap[msg.header.from] = msg.header.baiduid;
      this.emitChange();
    }
  }
}

module.exports = UidMapHandler;
