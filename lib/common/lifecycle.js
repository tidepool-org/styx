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
        process.emit('SIGTERM');
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