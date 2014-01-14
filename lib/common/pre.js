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

var util = require('util');

var except = require('./except.js');

exports.notNull = function(val, message)
{
  if (val == null) {
    throw except.IAE.apply(null, [message].concat(Array.prototype.slice.call(arguments, 2)));
  }
  return val;
}

exports.hasProperty = function(obj, property, message)
{
  if (obj == null) {
    throw except.IAE('Supposed to check for property[%s] on obj, but obj[%s] no exist!', property, obj);
  }
  if (obj[property] == null) {
    if (message == null) {
      message = util.format('property[%s] must be specified on object[%j]', property, obj);
    }
    throw except.IAE.apply(null, [message].concat(Array.prototype.slice.call(arguments, 3)));
  }
  return obj[property];
}

exports.defaultProperty = function(obj, property, val)
{
  if (obj == null) {
    obj = {};
  }
  if (obj[property] == null) {
    obj[property] = val;
  }
  return obj;
}

var typeOfHandlers = {
  array: function(val) {
    return Array.isArray(val);
  }
}

exports.isType = function(val, type, message) {
  var handler = typeOfHandlers[type];
  if (handler == null) {
    handler = function(arg){ return typeof(arg) === type; };
  }

  if (! handler(val)) {
    if (message == null) {
      message = util.format('Expected object of type[%s], got [%s]', type, typeof(val));
    }
    throw except.IAE.apply(null, [message].concat(Array.prototype.slice.call(arguments, 3)));
  }
  return val;
}