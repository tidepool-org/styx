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

var url = require('url');

var except = require('../common/except.js');
var log = require('../log.js')('rules.js');
var pre = require('../common/pre.js');

function proxyToWatch(proxy, watch) {
  return {
    handle: function (req, res) {
      var reqUrl = url.parse(req.url, true);
      var verbose = reqUrl.query.verbose !== undefined;

      var options = watch.get();
      if (options.length < 1) {
        return false;
      }

      var identifier = options[0];
      var host = identifier.host;
      var protocol = identifier.protocol == null ? 'https' : identifier.protocol;
      var targetUrl = url.format({ protocol: protocol, host: host });

      if (verbose) {
        log.info('Forwarding request to host[%s], url[%s] to [%s]', req.headers.host, req.url, targetUrl);
      }
      proxy.web(req, res, { target: targetUrl, secure: false }, function(err) {
        log.warn(err, 'Problem when forwarding request[%s] to [%s]', req.url, targetUrl);
        res.writeHead(500);
        res.end('Problem!!!');
      });
      return true;
    }
  };
}

module.exports = function(lifecycle, hakken, proxy) {
  var ruleBuilders = {
    random: function(config) {
      var service = pre.hasProperty(config, 'service');

      var watch = hakken.randomWatch(service, config.filter);
      lifecycle.add(service, watch);
      return proxyToWatch(proxy, watch);
    },
    pathPrefix: function(config) {
      var prefix = pre.hasProperty(config, 'prefix');
      var delegate = builder.build(pre.hasProperty(config, 'rule'));

      var stripPrefix = config.stripPrefix == null ? true : config.stripPrefix;

      return {
        handle: function (req, res) {
          var parsedUrl = url.parse(req.url);
          if (parsedUrl.pathname.indexOf(prefix) === 0) {
            if (stripPrefix) {
              parsedUrl.pathname = parsedUrl.pathname.substr(prefix.length);
              if (parsedUrl.pathname === '') {
                parsedUrl.pathname = '/';
              }
              req.url = url.format(parsedUrl);
            }
            return delegate.handle(req, res);
          }
          return false;
        }
      }
    }
  };

  var builder = {
    build: function(ruleSpec) {
      var type = pre.hasProperty(ruleSpec, 'type');

      var builderFn = ruleBuilders[type];
      if (builderFn == null) {
        throw except.IAE('Unknown builder type[%s], known types are[%s]', type, Object.keys(ruleBuilders));
      }

      return builderFn(ruleSpec);
    },
    buildAll: function(rules) {
      var self = this;

      var retVal = {};
      for (var id in rules) {
        retVal[id] = rules[id].map(function(spec) {
          log.info('id[%s], building rule[%j]', id, spec);
          return self.build(spec);
        });
      }
      return retVal;
    }
  };

  return builder;
};