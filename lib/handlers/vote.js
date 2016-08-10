'use strict';

const MsgHandler = require('../handler');
const debuglog = require('util').debuglog('vote');
const util = require('../util');
const constant = require('../constant');
const WEEK_TIME = 7 * 24 * 3600 * 1000;
const HALF_HOUR = 1800 * 1000;
const DAY_TIME = 24 * 3600 * 1000;

class VoteHandler extends MsgHandler {
  constructor(id, watchGroup, watchUser, dataSource, extraPersistentKeys = []) {
    super(id, ['vote'].concat(extraPersistentKeys));
    this.watchGroup = watchGroup;
    this.watchUser = watchUser;
    this.dataSource = dataSource;
    this.vote = null;
    this.byDay = true;
  }
  query(query) {
    return Promise.fromCallback(cb => {
      return this.app.db.find(query, cb);
    });
  }
  _onMsg(msg) {
    const self = this;
    // 每次有人说话都判断一次是否投过票
    if (!this.vote && msg.header.reply_to === this.watchGroup) {
      const date = new Date(msg.header.time);
      // 过了12点就不投了
      if (date.getHours() > 12) {
        return;
      }
      // 获取上线历史时间
      debuglog('start get history online time');
      let today = util.getDay(date);
      today = today + DAY_TIME;
      this.guess(today).then(data => {
        if (data.time === -1) {
          // 缺少历史数据
          return;
        }
        const voteTime = new Date(data.time);
        const voteStr = `/vote ${voteTime.getHours()}:${voteTime.getMinutes()}`;
        const prevWeekDaysStr = data.prevWeekDays.map(day => {
          return new Date(day).toLocaleString();
        }).join('\n');
        let verbose = `根据目标每周${date.getDay()}的上线时间\n${prevWeekDaysStr}`;
        if (data.prevFilteredDays.length > 0) {
          const prevFilteredDaysStr = data.prevFilteredDays.map(day => {
            return new Date(day).toLocaleString();
          }).join('\n');
          verbose += `\n筛选出靠谱的历史上线时间\n${prevFilteredDaysStr}`;
        }
        self.app.talk(
          msg.header.reply_to,
          msg.header.type,
          verbose
        );
        setTimeout(() => {
          self.app.talk(msg.header.reply_to, msg.header.type, voteStr);
        }, 200);
        self.vote = voteTime.getTime();
        self.emitChange();
      }).catch(err => {
        self.app.talk(constant.HEFANGSHI_UID, 1, err.stack);
        debuglog('get history online time failed', err);
      });
    }
  }
  guess(guessDay) {
    const self = this;
    return this.query({
      id: this.dataSource
    }).then(data => {
      const onlineTime = self.getUserFirstOnlineTime(self.watchUser, data);
      // 根据历史时间计算本次投票时间
      const days = Object.keys(onlineTime);
      const result = {
        time: -1,
        prevFilteredDays: [],
        prevWeekDays: []
      };
      days.sort();
      // 获取之前之前每周的上线时间
      const prevWeekDays = days.filter(day => {
        if (guessDay > day && (guessDay - day) % WEEK_TIME === 0) {
          return true;
        }
      });
      // 缺少历史数据
      if (prevWeekDays.length === 0) {
        return result;
      }
      // 获取历史加权平均时间
      debuglog('prev online in this day time is', prevWeekDays.map(day => {
        return new Date(onlineTime[day]).toLocaleString();
      }).join(','));
      result.prevWeekDays = prevWeekDays.map(day => {
        return onlineTime[day];
      });
      const avg = this.avgTime(guessDay, prevWeekDays, onlineTime);
      debuglog('get avg time by prev online', new Date(guessDay + avg).toLocaleString());
      const filteredDays = days.filter(day => {
        if (guessDay > day && Math.abs(avg - (onlineTime[day] - day)) < HALF_HOUR * 2) {
          return true;
        }
      });
      if (filteredDays.length < 2) {
        result.time = guessDay + avg;
        return result;
      }
      debuglog('filtered prev online time is', filteredDays.map(day => {
        return new Date(onlineTime[day]).toLocaleString();
      }).join(','));
      result.prevFilteredDays = filteredDays.map(day => {
        return onlineTime[day];
      });
      result.time = guessDay + this.avgTime(guessDay, filteredDays, onlineTime);
      return result;
    });
  }
  getUserFirstOnlineTime(user, onlineData) {
    return onlineData.reduce((acc, dayData) => {
      if (dayData.appearTime[user]) {
        acc[dayData.day] = dayData.day + dayData.appearTime[user].timestamp[0];
      };
      return acc;
    }, {});
  }
  avgTime(guessDay, days, onlineTime) {
    let total = 0;
    let m = 0;
    days.forEach(day => {
      var week = (guessDay - day) / DAY_TIME;
      const e = Math.pow(Math.E, -(week / 10));
      total += (onlineTime[day] - day) * e;
      m += e;
    });
    return Math.floor(total / m);
  }
}

module.exports = VoteHandler;
