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
          return theRules.some(function(rule) {
            return rule.handle.apply(rule, args);
          });
        }
      };
    }
  }
};