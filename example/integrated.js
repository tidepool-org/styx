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

var restify = require('restify');
var superagent = require('superagent');

var except = require('../lib/common/except.js');
var log = require('../lib/log.js')('example/integrated.js');

var lifecycle = require('../lib/common/lifecycle.js')();

function makeServer(hakken, port, replyString) {
  var server = restify.createServer({name: 'replyString'});
  server.get('/hi', function (req, res, next) {
    log.info('Got request at port[%s]!', port);
    res.send(200, replyString);
    next();
  });

  var started = false;
  var retVal = {
    start: function() {
      if (! started) {
        server.listen(port);
        hakken.start();
        hakken.publish({ service: 'integration', host: util.format('localhost:%s', port), protocol: 'http' });
        started = true;
      }
    },
    close: function() {
      if (started) {
        hakken.close();
        server.close();
        started = false;
      }
    }
  };
  lifecycle.add(util.format('%s/%s', port, replyString), retVal);
  return retVal
}

(function(){
  var hakkenPort = 21000;
  var hakken = require('hakken')(
    {
      host: util.format('localhost:%s', hakkenPort),
      heartbeatInterval: 1000,
      missedHeartbeatsAllowed: 3,
      resyncPollInterval: 3000
    }
  );

  var server1;
  var server2;
  var styxServer;
  var styxHakkenClient;

  function go(){
    lifecycle.start();

    var hakkenServer = lifecycle.add('hakkenServer', hakken.server.makeSimple('localhost', hakkenPort));
    server1 = makeServer(hakken.client.make(), 21001, 'Billy');
    server2 = makeServer(hakken.client.make(), 21002, 'Sally');

    var styx = require('../lib/styx.js')();
    var styxHakkenClient = hakken.client.make();
    lifecycle.add('styxHakkenClient', styxHakkenClient);
    var ruleBuilder = styx.makeRuleBuilder(styxHakkenClient, require('http-proxy').createProxyServer({}));
    var styxServer = styx.makeServer(
      ruleBuilder.buildAll({ 'localhost:21003' : [{service: 'integration', wrappers: [{fn: 'random'}]}]})
    );
    styxServer.withHttp(21003);
    lifecycle.add('styxServer', styxServer);
    lifecycle.join();

    setTimeout(bothServers.bind(this, server2Only), 3000);
  }

  function bothServers(next) {
    superagent.get('http://localhost:21001/hi').end(function (error, res) {
      if (error != null || res.error) {
        log.warn(error, 'Problem talking to server1, statusCode[%s]', res.status);
        throw except.IAE('Problem talking to server1, statusCode[%s]', res.status);
      }
      if (res.body !== 'Billy') {
        throw except.IAE("Didn't get Billy from server1, got: ", res.body);
      }
      log.info('Successfully spoke to server1');
    });

    superagent.get('http://localhost:21002/hi').end(function (error, res) {
      if (error != null || res.error) {
        log.warn(error, 'Problem talking to server2, statusCode[%s]', res.status);
        throw except.IAE('Problem talking to server2, statusCode[%s]', res.status);
      }
      if (res.body !== 'Sally') {
        throw except.IAE("Didn't get Sally from server2, got: ", res.body);
      }
      log.info('Successfully spoke to server2');
    });

    var count = 0;
    var sawBilly = false;
    var sawSally = false;
    var numRuns = 10;

    function styxDone() {
      if (count >= 10) {
        if (sawBilly && sawSally) {
          log.info('Worked, killing server1 and moving on!');
          server1.close();
          setTimeout(next, 5000);
          return;
        }
        throw except.IAE("10 runs and didn't see billy[%s] or sally[%s]", sawBilly, sawSally);
      }
    }

    for (var i = 0; i < numRuns; ++i) {
      superagent.get('http://localhost:21003/hi').query({verbose: true}).end(function(error, res){
        if (error != null || res.error) {
          log.warn(error, 'Problem talking to styx, statusCode[%s]', res.status);
          throw except.IAE('Problem talking to styx, statusCode[%s]', res.status);
        }
        ++count;
        var payload = res.body;
        log.info('count[%s] value from styx[%s]', count, payload);
        if (payload === 'Billy') {
          sawBilly = true;
        }
        if (payload === 'Sally') {
          sawSally = true;
        }
        styxDone();
      });
    }

    setTimeout(
      function() {
        if (count != numRuns) {
          throw except.ISE("Should've completed %s request by now.  Completed %s.", numRuns, count);
        }
      },
      10000
    );
  }

  function server2Only() {
    log.info('Running against server2 only.');
    superagent.get('http://localhost:21001/hi').end(function (error, res) {
      if (error == null) {
        throw except.IAE("Was able to talk to server1, it should be dead.  res[%s][%s]", res.status, res.body);
      }
    });

    superagent.get('http://localhost:21002/hi').end(function (error, res) {
      if (error != null || res.error) {
        log.warn(error, 'Problem talking to server2, statusCode[%s]', res.status);
        throw except.IAE('Problem talking to server2, statusCode[%s]', res.status);
      }
      if (res.body !== 'Sally') {
        throw except.IAE("Didn't get Sally from server2, got: ", res.body);
      }
      log.info('Successfully spoke to server2');
    });

    var count = 0;
    var sawBilly = false;
    var sawSally = false;
    var numRuns = 10;

    function styxDone() {
      if (count >= 10) {
        if (!sawBilly && sawSally) {
          log.info('Worked!  Starting server1 again.');
          server1 = makeServer(hakken.client.make(), 21001, 'Billy');
          setTimeout(bothServers.bind(this, done), 5000);
          return;
        }
        throw except.IAE("10 runs and didn't see billy[%s] or sally[%s]", sawBilly, sawSally);
      }
    }

    for (var i = 0; i < numRuns; ++i) {
      superagent.get('http://localhost:21003/hi').query({verbose: true}).end(function(error, res){
        if (error != null || res.error) {
          log.warn(error, 'Problem talking to styx, statusCode[%s]', res.status);
          throw except.IAE(error, 'Problem talking to styx, statusCode[%s]', res.status);
        }
        ++count;
        var payload = res.body;
        log.info('count[%s] value from styx[%s]', count, payload);
        if (payload === 'Billy') {
          sawBilly = true;
        }
        if (payload === 'Sally') {
          sawSally = true;
        }
        styxDone();
      });
    }

    setTimeout(
      function() {
        if (count != numRuns) {
          throw except.ISE("Should've completed %s request by now.  Completed %s.", numRuns, count);
        }
      },
      10000
    );
  }

  function done(){
    log.info("All done!");
    process.emit('SIGTERM')
  }

  go();
})();