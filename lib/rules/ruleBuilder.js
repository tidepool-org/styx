var url = require('url');

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
      proxy.web(req, res, { target: targetUrl }, function(err) {
        log.warn(err, 'Problem when forwarding request[%s] to [%s]', req.url, targetUrl);
        res.writeHead(500);
        res.end('Problem!!!');
      });
      return true;
    }
  };
}

module.exports = function(hakken, proxy) {
  return {
    build: function(ruleSpec) {
      var service = pre.hasProperty(ruleSpec, 'service');
      var wrappers = ruleSpec['wrappers'];

      var watch = hakken.watch(service);
      if (wrappers != null) {
        watch = hakken.watchers.buildWrapper(wrappers).wrap(watch);
      }

      return proxyToWatch(proxy, watch);
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
  }
}