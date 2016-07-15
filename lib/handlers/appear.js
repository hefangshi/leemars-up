'use strict';

const MsgHandler = require('../handler');
const debuglog = require('util').debuglog('appear');
const util = require('../util');

class AppearHandler extends MsgHandler {
  constructor(id, watchUserList, extraPersistentKeys = []) {
    super(id, ['appearTime'].concat(extraPersistentKeys));
    this.watchUserList = watchUserList;
    this.today = util.getDay(Date.now());
    this.byDay = true;
    this.initAppearTime();
  }
  initAppearTime() {
    debuglog('day changed to %d', this.today);
    if (this.watchUserList === '*') {
      this.watchAll = true;
      this.appearTime = {};
    }
    else {
      this.appearTime = this.watchUserList.reduce((acc, user) => {
        acc[user] = {
          timestamp: []
        };
        return acc;
      }, {});
    }
  }
  _onMsg(msg) {
    const msgDay = util.getDay(msg.header.time);
    if (this.today !== msgDay) {
      this.today = msgDay;
      this.initAppearTime();
    }
    if (this.watchAll) {
      this.appearTime[msg.header.from] = this.appearTime[msg.header.from] || {
        timestamp: []
      };
    }
    const watchUser = this.appearTime[msg.header.from];
    if (watchUser) {
      if (watchUser.timestamp.length === 0) {
        debuglog('%s first appeared in %d', msg.header.baiduid, msg.header.time);
      }
      else {
        debuglog('%s appeared in %d', msg.header.baiduid, msg.header.time);
      }
      watchUser.timestamp.push(msg.header.time - this.today);
      this.emit('appear', {
        id: msg.header.from,
        reply_to: msg.header.reply_to,
        time: msg.header.time,
        isFirstAppear: watchUser.timestamp.length === 1,
        type: msg.header.type
      });
      this.emitChange();
    }
  }
}

class AppearInGroupHandler extends AppearHandler {
  constructor(id, watchUserList, groupId, extraPersistentKeys = []) {
    super(id, watchUserList, extraPersistentKeys);
    this.groupId = groupId;
  }
  _onMsg(msg) {
    if (msg.header.reply_to === this.groupId) {
      super._onMsg(msg);
    }
  }
}

module.exports.AppearHandler = AppearHandler;
module.exports.AppearInGroupHandler = AppearInGroupHandler;
