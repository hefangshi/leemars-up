'use strict';

const MsgHandler = require('./msg');
const debuglog = require('util').debuglog('appear');

class AppearHandler extends MsgHandler {
  constructor(id, watchUserList, extraPersistentKeys = []) {
    super(id, ['watchList'].concat(extraPersistentKeys));
    this.watchList = (watchUserList || []).reduce((acc, uid) => {
      acc[uid] = {
        firstAppear: -1,
        appearTimestamp: []
      };
      return acc;
    }, {});
  }
  _isFirstAppear(user) {
    return user.appearTimestamp.length !== 0 && user.firstAppear === -1;
  }
  _onMsg(msg) {
    const watchUser = this.watchList[msg.header.from];
    if (watchUser) {
      watchUser.appearTimestamp.push(msg.header.time);
      debuglog('%s appeared in %d', msg.header.baiduid, msg.header.time);
      if (this._isFirstAppear(watchUser)) {
        watchUser.firstAppear = msg.header.time;
        debuglog('%s first appeared in %d', msg.header.baiduid, msg.header.time);
      }
    }
  }
}

class AppearInGroupHandler extends AppearHandler {
  constructor(id, watchUserList, groupId, extraPersistentKeys = []) {
    super(id, watchUserList, ['groupId'].concat(extraPersistentKeys));
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
