'use strict';

const MsgHandler = require('../handler');
const constant = require('../constant');

class AliveHandler extends MsgHandler {
  constructor(id, extraPersistentKeys = []) {
    super(id, extraPersistentKeys);
  }
  _onMsg(msg) {
    if (msg.msg && msg.msg.indexOf('活着么') >= 0 && msg.msg.indexOf('nozuonodie') >= 0) {
      this.app.talk(msg.header.reply_to, msg.header.type, '活着呢，别叫了！');
    }
  }
}

module.exports = AliveHandler;
