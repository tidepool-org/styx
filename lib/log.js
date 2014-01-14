var _ = require('lodash');
var baseLog = require('bunyan').createLogger({name: 'styx'});

function createLogger(filename, extraObjects)
{
  if (extraObjects == null) {
    extraObjects = {};
  }

  var extras = _.cloneDeep(extraObjects);
  extras.srcFile = filename;

  return baseLog.child(extras);
}

module.exports = createLogger;