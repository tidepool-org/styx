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

var log = require('../log.js')('styx/lib/common/lifecycle.js');
var pre = require('./pre.js');

module.exports = function() {
  var objectsToManage = [];
  var started = false;

  return {
    add: function(name, obj) {
      pre.notNull(name, 'Must specify a name');
      pre.notNull(obj, 'Must specify the object to add');

      objectsToManage.push({ name: name, obj: obj });
      if (started) {
        obj.start();
      }
      return obj;
    },
    start: function() {
      started = true;
      for (var i = 0; i < objectsToManage.length; ++i) {
        log.info('Starting obj[%s]', objectsToManage[i].name);
        objectsToManage[i].obj.start();
      }
    },
    close: function() {
      started = false;
      for (var i = 0; i < objectsToManage.length; ++i) {
        try {
          log.info('Closing obj[%s]', objectsToManage[i].name);
          objectsToManage[i].obj.close();
        }
        catch (e) {
          log.error(e, 'Error closing object: ', objectsToManage[i].name);
        }
      }
    },
    join: function() {
      var self = this;

      process.on('uncaughtException', function (err) {
        log.error(err, 'uncaughtException, stopping myself!');
        self.close();
        process.exit(1);
      });
      process.on('SIGINT', process.emit.bind(process, 'SIGTERM'));
      process.on('SIGHUP', process.emit.bind(process, 'SIGTERM'));
      process.on('SIGTERM', function () {
        log.info('Shutting down.');
        self.close();
      });
    }
  };
};