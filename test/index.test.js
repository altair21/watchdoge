var main = require('../lib/index');
var should = require('should');

describe('test/index.test.js', function () {
  it('Usage: watchdoge [command]', function () {
    main.main().should.equal(1);
  });
});
