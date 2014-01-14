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