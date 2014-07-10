/*
 * Copyright (c) 2014, Tidepool Project
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or other
 * materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var util = require('util');

var amoeba = require('amoeba');
var except = amoeba.except;
var pre = amoeba.pre;

var charonFactory = require('./charon.js');
var log = require('./log.js')('styx.js');

module.exports = function () {
  return {
    makeRuleBuilder: require('./rules/ruleBuilder.js'),
    makeServer: function(rules) {
      function makeHandlerFn(charon) {
        return function (req, res) {
          var host = req.headers.host;
          var ferry = charon.find(host);
          if (ferry == null) {
            res.writeHead(404);
            res.end(util.format('Unknown host[%s]', host));
          }
          else {
            if (!ferry.handle(req, res)) {
              res.writeHead(404);
              res.end(util.format('Unknown path[%s]', req.url));
            }
          }
        }
      }

      var httpHandler = null;
      var httpsHandler = null;
      if (rules.http != null || rules.https != null) {
        if (rules.http != null) {
          httpHandler = makeHandlerFn(charonFactory(rules.http))
        }
        if (rules.https != null) {
          httpsHandler = makeHandlerFn(charonFactory(rules.https))
        }
      } else {
        httpHandler = makeHandlerFn(charonFactory(rules));
        httpsHandler = httpHandler;
      }

      var objectsToManage = [];
      return {
        withHttp: function(port){
          pre.notNull(httpHandler, "Must specify http rules in order to listen on http");
          var server = require('http').createServer(httpHandler);
          objectsToManage.push(
            {
              start: function(){
                server.listen(port);
                log.info('Styx HTTP on port[%s]', port);
              },
              close: server.close.bind(server)
            }
          );
          return this;
        },
        withHttps: function(port, config){
          pre.notNull(httpsHandler, "Must specify https rules in order to listen on https");
          var server = require('https').createServer(config, httpsHandler);
          objectsToManage.push(
            {
              start: function(){
                server.listen(port);
                log.info('Styx HTTPS on port[%s]', port);
              },
              close: server.close.bind(server)
            }
          );
          return this;
        },
        start: function() {
          if (objectsToManage.length < 1) {
            throw except.ISE("Styx must listen on a port to be useful, specify an http, https or both.");
          }

          objectsToManage.forEach(function(obj){ obj.start(); });
          return this;
        },
        close: function() {
          objectsToManage.forEach(function(obj){ obj.close(); });
          return this;
        }
      }
    }
  }
};