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

var fixture = require('../fixture.js');

var expect = fixture.expect;
var sinon = fixture.sinon;
var mockableObject = fixture.mockableObject;

describe('ruleBuilder.js', function(){
  var selectorFns = { random: 'random' };

  var proxy = {};
  var hakken;
  var ruleBuilder;
  beforeEach(function(){
    hakken = mockableObject.make('watch');
    hakken.watchers = mockableObject.make('buildWrapper');
    ruleBuilder = require('../../lib/rules/ruleBuilder.js')(hakken, proxy);
  });

  describe('api compatibility', function(){
    it('should be able to create a random rule with only a service name', function(){
      sinon.stub(hakken, 'watch').returns({});
      var rules = ruleBuilder.buildAll({ id: [{service: 'billy'}]});

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
      expect(hakken.watch).to.have.been.calledOnce;
      expect(hakken.watch).to.have.been.calledWith('billy');
    });

    it('uses wrappers if defined', function(){
      sinon.stub(hakken, 'watch').returns({});
      var wrapper = mockableObject.make('wrap');
      sinon.stub(wrapper, 'wrap').returns(function(arg){return arg;});
      sinon.stub(hakken.watchers, 'buildWrapper').returns(wrapper);
      var rules = ruleBuilder.buildAll({ id: [{service: 'billy', wrappers: [{fn: 'random'}]}]});

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
      expect(hakken.watch).to.have.been.calledOnce;
      expect(hakken.watch).to.have.been.calledWith('billy');
      expect(hakken.watchers.buildWrapper).to.have.been.calledOnce;
      expect(hakken.watchers.buildWrapper).to.have.been.calledWith([{fn: 'random'}]);
      expect(wrapper.wrap).to.have.been.calledOnce;
      expect(wrapper.wrap).to.have.been.calledWith({});
    });
  });
});