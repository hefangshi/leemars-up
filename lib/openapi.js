'use strict';

const http = require('http');
const url = require('url');
const qs = require('querystring');

class OpenApi {
    constructor(db, port) {
        this.db = db;
        this.rules = [{
            rule: /^\/data\/handler\/(.*?)\/day\/(\d*)\/?/,
            handler: this.getHandlerData.bind(this)
        }, {
            rule: /^\/data\/handler\/(.*)\/?/,
            handler: this.getHandlerData.bind(this)
        }];
        this.server = http.createServer(this.handler.bind(this));
        this.port = port;
    }
    handler(req, res) {
        req.query = qs.parse(url.parse(req.url).query);
        res.mayJSONP = (data) => {
            const jsonpCallback = req.query.callback;
            const body = JSON.stringify(data);
            res.setHeader('Content-Type', 'application/x-javascript');
            if (jsonpCallback) {
                res.end(`${jsonpCallback}(${body})`);
            } else {
                res.end(body);
            }
        };
        let found = false;
        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const match = req.url.split('?')[0].match(rule.rule);
            if (match) {
                req.params = match.slice(1);
                rule.handler(req, res);
                found = true;
                break;
            }
        }
        if (!found) {
            res.statusCode = 404;
            res.end('Not Found');
        }
    }
    run() {
        this.server.listen(this.port);
    }
    getHandlerData(req, res) {
        Promise.fromCallback(cb => {
            let query = {
                id: req.params[0]
            };
            if (req.params[1]) {
                query.day = parseInt(req.params[1], 10);
            }
            return this.db.find(query, cb);
        }).then(doc => {
            if (!doc) {
                throw new Error('invalid params');
            }
            res.mayJSONP({
                data: doc,
                errno: 0
            });
        }).catch(e => {
            res.mayJSONP({
                msg: e.message,
                errno: 10000
            });
        });
    }
}

module.exports = OpenApi;
