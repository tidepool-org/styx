var pre = require('./common/pre.js');

/**
 * Charon is the "ferryman of Hades", he was the one who controlled the ferry that took souls across the river styx.
 *
 * @param rulesSpec - An object of id -> list of rules.
 * @returns {{find: find}}
 */
module.exports = function(rulesSpec){
  var rules = {};

  pre.isType(rulesSpec, 'object', 'Rules must be an object');
  for (var id in rulesSpec) {
    var ruleArray = rulesSpec[id];
    pre.isType(ruleArray, 'array', 'Rule for id[%s] must be an array, got [%s]', id, ruleArray);
    for (var i = 0; i < ruleArray.length; ++i) {
      var handler = rulesSpec[id][i].handle;
      pre.isType(handler, 'function', "Property 'handler' Rule id[%s], index[%s] should be a function, got [%s]", id, i, handler);
    }
    rules[id.toLowerCase()] = rulesSpec[id];
  }

  return {
    find: function(identifier) {
      var theRules = rules[identifier.toLowerCase()];

      if (theRules == null) {
        theRules = rules["*"];
      }

      if (theRules == null) {
        return null;
      }

      return {
        handle: function() {
          var args = Array.prototype.slice.call(arguments, 0);
          for (var i = 0; i < theRules.length; ++i) {
            if (theRules[i].handle.apply(theRules[i], args)) {
              return true;
            }
          }
          return false;
        }
      };
    }
  }
};