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

var config = require('./lib/common/config.js');
var except = require('./lib/common/except.js');

module.exports = (function(){
  var env = {};

  // The port to attach an HTTP listener, if null, no HTTP listener will be attached
  env.http_port = config.fromEnvironment('HTTP_PORT', null);

  // The port to attach an HTTPS listener, if null, no HTTPS listener will be attached
  env.https_port = config.fromEnvironment('HTTPS_PORT', null);

  // The https certificate to use.  This should be a single, .pfx file.
  env.https_cert = config.fromEnvironment('HTTPS_CERTIFICATE', null);
  if (env.https_port != null && env.https_cert == null) {
    throw except.ISE('Configured to use https, but no certificate set, please set HTTPS_CERTIFICATE');
  }
  if (env.https_cert.substr(env.https_cert.length - 4) !== '.pfx') {
    throw except.ISE('https certificate should be a single .pfx file, got[%s]', env.https_cert);
  }

  // A JSON object of domain -> JSON Array of rules.  Domains ignore case and must be exact.
  // The domain "*" is a catchall for everything that didn't match a specific domain.
  //
  // The rules are applied by first taking the value of the Host: header, looking up the correct
  // set of rules for the specific host and then running through the rules until it finds a rule
  // that covers the request.  The request is then delegated to that rule and styx forgets about it.
  env.rules = JSON.parse(config.fromEnvironment('RULES'));

  return env;
})();