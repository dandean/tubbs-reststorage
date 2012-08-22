// This file will get compiled by Modulr and served as /tubbs.js
var assert = require('assert');
var Tubbs = require('tubbs');
var RestStorage = require('../../index');

describe('RestStorage', function() {

  var User;

  before(function() {
    User = Tubbs.create({
      // Persist our data with Riak
      dataStore: new RestStorage({
        url: '/users'
      }),

      primaryKey: 'username',
      
      fields: {
        username: undefined,
        first: "Rad",
        last: undefined,
        email: undefined
      },
    
      virtual: {
        name: function() {
          return ((this.first || '') + ' ' + (this.last || '')).trim();
        }
      }
    });
  });

  it('should work', function(done) {

    var user = new User({
      first: "Dan",
      last: "Dean",
      email: "tubby@tubbs.co"
    });

    user.save(function(e){
    });

    done();
  });
});
