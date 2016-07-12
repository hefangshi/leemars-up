'use strict';

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const PERSISTENT_FILE = path.join(__dirname, 'PERSISTENT_FILE.json');
const LEEMARS_UID = 16888043;
const HEFANGSHI_UID = 11725261;
const GROUP = 1462626;

const AppearInGroupHandler = require('./lib/appear').AppearInGroupHandler;

class App {
  constructor(url) {
    this.handlers = [];
    this.url = url;
  }
  use(handler) {
    this.handlers.push(handler);
  }
  onMsg(msg) {
    this.handlers.forEach(handler => {
      handler.onMsg(msg);
    });
  }
  run() {
    const self = this;
    this.ws = new WebSocket(this.url, {
      protocolVersion: 13
    });
    this.ws.on('open', () => {
      console.log('hiservice connected');
    });
    this.ws.on('message', (msg) => {
      try {
        self.onMsg(JSON.parse(msg));
      }
      catch (e) {}
    });
    this.ws.on('error', (err) => {
      console.error('ws connect failed', err);
      setTimeout(() => {
        self.run();
      }, 5 * 1000);
    });
  }
  dump(fileName) {
    const data = this.handlers.reduce((acc, handler) => {
      acc[handler.id] = handler.dump();
      return acc;
    }, {});
    fs.writeFileSync(fileName, JSON.stringify(data));
    console.log('dump to', fileName);
  }
  load(fileName) {
    try {
      const data = JSON.parse(fs.readFileSync(fileName).toString());
      this.handlers.forEach(handler => {
        handler.load(data[handler.id]);
      });
      console.log('persistent data loaded');
    }
    catch (e) {
      console.error('read persistent data failed,', e.message);
    }
  }
}

const app = new App('ws://10.94.169.106:8999');
app.use(new AppearInGroupHandler('APPEAR_IN_GROUP', [LEEMARS_UID, HEFANGSHI_UID], GROUP));
app.load(PERSISTENT_FILE);
app.run();

process.on('exit', () => {
  app.dump(PERSISTENT_FILE);
});

setInterval(() => {
  app.dump(PERSISTENT_FILE);
}, 60 * 1000);

process.on('uncaughtException', (e) => {
  console.error(e);
  process.exit(1);
});

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});
