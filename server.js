(function () {
  var config = require('./env.js');
  var lifecycle = require('./lib/common/lifecycle.js')();
  var hakken = require('hakken')(config.discovery).client.make();
  var proxy = require('http-proxy').createProxyServer({});

  lifecycle.add('hakken', hakken);

  var styx = require('./lib/styx.js');
  var ruleBuilder = styx.makeRuleBuilder(hakken, proxy);
  var rules = ruleBuilder.buildAll(config.rules);
  var server = styx.makeServer(rules);

  if (config.http_port != null) {
    server.withHttp(config.http_port);
  }
  if (config.https_port != null) {
    server.withHttps(config.https_port, { pfx: config.https_cert});
  }
  lifecycle.add(server);

  lifecycle.start();
  lifecycle.join();
})();