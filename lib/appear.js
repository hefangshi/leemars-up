'use strict';

const MsgHandler = require('./msg');
const debuglog = require('util').debuglog('appear');

class AppearHandler extends MsgHandler {
  constructor(id, watchUserList, extraPersistentKeys = []) {
    super(id, ['watchList'].concat(extraPersistentKeys));
    if (watchUserList === '*') {
      this.watchAll = true;
      watchUserList = [];
    }
    this.watchList = (watchUserList || []).reduce((acc, uid) => {
      acc[uid] = {};
      return acc;
    }, {});
  }
  _onMsg(msg) {
    if (this.watchAll) {
      this.watchList[msg.header.from] = this.watchList[msg.header.from] || {};
    }
    const watchUser = this.watchList[msg.header.from];
    if (watchUser) {
      let today = new Date(msg.header.time);
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);
      today = today.getTime();
      if (!watchUser[today]) {
        watchUser[today] = {
          appearTimestamp: [msg.header.time - today],
          firstAppear: msg.header.time
        };
        debuglog('%s first appeared in %d', msg.header.baiduid, msg.header.time);
      } else {
        watchUser[today].appearTimestamp.push(msg.header.time - today);
        debuglog('%s appeared in %d', msg.header.baiduid, msg.header.time);
      }
      this.emit('appear', {
        id: msg.header.from,
        reply_to: msg.header.reply_to,
        time: msg.header.time,
        isFirstAppear: watchUser[today].appearTimestamp.length === 1,
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
