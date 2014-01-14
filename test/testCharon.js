var fixture = require('./fixture.js');

var expect = fixture.expect;
var sinon = fixture.sinon;
var mockableObject = fixture.mockableObject;

describe("charon.js", function(){
  function makeRule() {
    return mockableObject.make('handle');
  }

  var charonFactory = require('../lib/charon.js');
  var rules;

  beforeEach(function(){
    rules = {
      one: [makeRule()],
      two: [makeRule(), makeRule()]
    };
  });

  describe("rules with no default", function(){
    var charon;

    beforeEach(function(){
      charon = charonFactory(rules);
    });

    it('should pass a sanity check', function(){
      var rule = rules['one'][0];
      sinon.stub(rule, 'handle').returns(true);

      var ferry = charon.find('one');
      expect(ferry).to.exist;
      expect(rule.handle).to.not.have.been.called;

      expect(ferry.handle(1, 2)).to.be.true;
      expect(rule.handle).to.have.been.calledOnce;
      expect(rule.handle).to.have.been.calledWith(1, 2);
    });

    it('should return null if no matching id', function(){
      var ferry = charon.find('billy');
      expect(ferry).to.be.null;
    });

    it('should stop on the first rule that returns true', function(){
      var rule = rules['two'][0];
      sinon.stub(rule, 'handle').returns(true);

      var ferry = charon.find('two');
      expect(ferry).to.exist;
      expect(rule.handle).to.not.have.been.called;

      expect(ferry.handle(1, 2)).to.be.true;
      expect(rule.handle).to.have.been.calledOnce;
      expect(rule.handle).to.have.been.calledWith(1, 2);
    });

    it('should continue onto the next rule if a rule returns false', function(){
      var rule1 = rules['two'][0];
      var rule2 = rules['two'][1];
      sinon.stub(rule1, 'handle').returns(false);
      sinon.stub(rule2, 'handle').returns(true);

      var ferry = charon.find('two');
      expect(ferry).to.exist;
      expect(rule1.handle).to.not.have.been.called;
      expect(rule2.handle).to.not.have.been.called;

      expect(ferry.handle(1, 2)).to.be.true;
      expect(rule1.handle).to.have.been.calledOnce;
      expect(rule1.handle).to.have.been.calledWith(1, 2);
      expect(rule2.handle).to.have.been.calledOnce;
      expect(rule2.handle).to.have.been.calledWith(1, 2);
    });

    it('should return false if host matched, but no rules match', function(){
      var rule1 = rules['two'][0];
      var rule2 = rules['two'][1];
      sinon.stub(rule1, 'handle').returns(false);
      sinon.stub(rule2, 'handle').returns(false);

      var ferry = charon.find('two');
      expect(ferry).to.exist;
      expect(rule1.handle).to.not.have.been.called;
      expect(rule2.handle).to.not.have.been.called;

      expect(ferry.handle(1, 2)).to.be.false;
    });
  });

  describe("rules with a default", function(){
    beforeEach(function(){
      rules['*'] = [makeRule()];
      charon = charonFactory(rules);
    });

    it('defaults to * when no matching id', function(){
      var rule = rules['*'][0];
      sinon.stub(rule, 'handle').returns(true);

      var ferry = charon.find('billy');
      expect(ferry).to.exist;
      expect(rule.handle).to.not.have.been.called;

      expect(ferry.handle(1, 2)).to.be.true;
      expect(rule.handle).to.have.been.calledOnce;
      expect(rule.handle).to.have.been.calledWith(1, 2);
    });

    it("should return false if host matched, but no rules match, even if there's a default.", function(){
      var rule1 = rules['two'][0];
      var rule2 = rules['two'][1];
      sinon.stub(rule1, 'handle').returns(false);
      sinon.stub(rule2, 'handle').returns(false);

      var ferry = charon.find('two');
      expect(ferry).to.exist;
      expect(rule1.handle).to.not.have.been.called;
      expect(rule2.handle).to.not.have.been.called;

      expect(ferry.handle(1, 2)).to.be.false;
    });
  });
});