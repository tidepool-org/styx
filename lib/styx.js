var util = require('util');

var charonFactory = require('./charon.js');
var except = require('./common/except.js');
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

      var handler = makeHandlerFn(charonFactory(rules));

      var objectsToManage = [];
      return {
        withHttp: function(port){
          var server = require('http').createServer(handler);
          objectsToManage.push(
            {
              start: function(){ server.listen(port); },
              close: server.close.bind(server)
            }
          );
          return this;
        },
        withHttps: function(port, config){
          var server = require('https').createServer(config, handler);
          objectsToManage.push(
            {
              start: function(){ server.listen(port); },
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
          objectsToManage.forEach(function(obj){
            obj.close();
          });
          return this;
        }
      }
    }
  }
}