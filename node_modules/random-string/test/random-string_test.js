'use strict';

var randomString = require('../lib/random-string.js');

exports['randomString'] = {

  'default_length': function(test) {
    test.expect(1);
    test.equal(randomString().length, 8, 'the random string should be excactly 8 characters long');
    test.done();
  },

  'change_length': function(test) {
    test.expect(1);
    test.equal(randomString({length: 5}).length, 5, 'the random string should be excactly 5 characters long now');
    test.done();
  },

  'include_only_numbers': function(test) {
    test.expect(3);
    var result = randomString({
      numeric: true,
      letters: false,
      special: false
    });
    test.ok(/^\d+$/.test(result), 'the random string should include only numbers');
    test.equal(/^[a-zA-Z]+$/.test(result), false, 'the random string should not include letters');
    test.equal(/^[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]+$/.test(result), false, 'the random string should not include specials');
    test.done();
  },

  'include_only_letters': function(test) {
    test.expect(3);
    var result = randomString({
      numeric: false,
      letters: true,
      special: false
    });
    test.equal(/^\d+$/.test(result), false, 'the random string should not include numbers');
    test.ok(/^[a-zA-Z]+$/.test(result), 'the random string should include only letters');
    test.equal(/^[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]+$/.test(result), false, 'the random string should not include specials');
    test.done();
  },

  'include_only_specials': function(test) {
    test.expect(3);
    var result = randomString({
      numeric: false,
      letters: false,
      special: true
    });
    test.equal(/^\d+$/.test(result), false, 'the random string should not include numbers');
    test.equal(/^[a-zA-Z]+$/.test(result), false, 'the random string should not include letters');
    test.ok(/^[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]+$/.test(result), 'the random string should include only specials');
    test.done();
  }

};
