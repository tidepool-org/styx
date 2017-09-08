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

describe('ruleBuilder.js', function(){
  var proxy = { web: function() {} };
  var hakken;
  var lifecycle;
  var ruleBuilder;
  beforeEach(function(){
    hakken = require('hakken')({host: 'localhost:1234'}).client();
    lifecycle = require('amoeba').lifecycle();
    ruleBuilder = require('../../lib/rules/ruleBuilder.js')(lifecycle, hakken, proxy);
  });

  describe('api compatibility', function(){
    it('should be able to create a random rule', function(){
      sinon.stub(hakken, 'watch').returns({ get: function(){ return ['1234']; }});
      sinon.spy(lifecycle, 'add');
      var rules = ruleBuilder.buildAll(
        { id: [{type: 'random', service: 'billy'}] }
      );

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
      expect(hakken.watch).to.have.been.calledOnce;
      expect(hakken.watch).to.have.been.calledWith('billy');
      expect(lifecycle.add).to.have.been.calledOnce;
      expect(lifecycle.add).to.have.been.calledWith('billy', sinon.match.object);
    });

    it('should be able to create a pathMatch rule', function(){
      sinon.spy(lifecycle, 'add');
      sinon.stub(hakken, 'watch').returns({ get: function(){ return ['1234']; }});
      var rules = ruleBuilder.buildAll(
        {
          id: [{type: 'pathMatch', match: '/v1/cars/[0-9]+/tires', rule: {type: 'random', service: 'bob'}}]
        }
      );

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
      expect(hakken.watch).to.have.been.calledOnce;
      expect(hakken.watch).to.have.been.calledWith('bob');
      expect(lifecycle.add).to.have.been.calledOnce;
      expect(lifecycle.add).to.have.been.calledWith('bob', sinon.match.object);

      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v1/cars/0/tires' })).is.true;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v1/cars/123456/tires' })).is.true;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v1/cars/123' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v1/cars//tires' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v1/cars/abc/tires' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v1/cars/123/tires/456' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/v2/cars/123/tires' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/bob' })).is.false;
    });

    it('should be able to create a pathPrefix rule', function(){
      sinon.spy(lifecycle, 'add');
      sinon.stub(hakken, 'watch').returns({ get: function(){ return ['1234']; }});
      var rules = ruleBuilder.buildAll(
        {
          id: [{type: 'pathPrefix', prefix: "/howdy", rule: {type: 'random', service: 'billy'}}]
        }
      );

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
      expect(hakken.watch).to.have.been.calledOnce;
      expect(hakken.watch).to.have.been.calledWith('billy');
      expect(lifecycle.add).to.have.been.calledOnce;
      expect(lifecycle.add).to.have.been.calledWith('billy', sinon.match.object);

      expect(rules['id'][0].handle({ url: 'http://localhost:1234/howdy' })).is.true;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/howdy/there' })).is.true;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/howd' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/not/howdy' })).is.false;
      expect(rules['id'][0].handle({ url: 'http://localhost:1234/billy' })).is.false;
    });

    it('should be able to create a cors rule', function(){
      var rules = ruleBuilder.buildAll(
        {
          id: [{type: 'cors', headers: {header1: 'value', header2: 'value2'}}]
        }
      );

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
    });

    it('should be able to create a staticService rule', function(){
      sinon.spy(lifecycle, 'add');
      sinon.spy(hakken, 'staticWatch');
      var hosts = [{ protocol: 'https', host: 'billy:1234' }];
      var rules = ruleBuilder.buildAll(
        {
          id: [{type: 'staticService', hosts: hosts}]
        }
      );

      expect(rules).to.have.property('id').with.length(1);
      expect(rules['id'][0]).to.have.property('handle').is.a('function');
      expect(hakken.staticWatch).to.have.been.calledOnce;
      expect(hakken.staticWatch).to.have.been.calledWith(hosts);
      expect(lifecycle.add).to.have.been.calledOnce;
      expect(lifecycle.add).to.have.been.calledWith('https://billy:1234', sinon.match.object);
    });
  });
});
