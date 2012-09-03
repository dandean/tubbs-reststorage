// This file will get compiled by Modulr and served as /tubbs.js
var assert = require('assert');
var Tubbs = require('tubbs');
var RestStorage = require('../../index');

// Export the require function for easy console debugger.
window.__require = require;

describe('RestStorage', function() {

  var User, user;

  before(function() {
    User = Tubbs.define({
      // Persist our data via REST
      dataStore: {
        type: RestStorage,
        options: { url: '/users' }
      },

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

  it('should fetch data from the server', function(done) {
    User.fetch(function() {
      assert.ok(Object.keys(User.dataStore.data).length > 0);
      done();
    });
  });

  it('should save a new model to the server', function(done) {

    user = new User({
      first: "Dan",
      last: "Dean",
      email: "tubby@tubbs.co"
    });

    // Username should be in client ID format:
    assert.ok(user.username.match(/__\d+__/));

    user.save(function(e, result){
      assert.equal(null, e);
      assert.equal(user, result);
      assert.equal('dandean', user.username);
      assert.equal('Dan', user.first);
      assert.equal('Dean', user.last);
      assert.equal('tubby@tubbs.co', user.email);
      done();
    });
  });

  it('should get find a model in the collection', function(done) {
    User.find('dandean', function(e, result) {
      assert.equal(null, e);
      assert.equal(user, result);
      assert.equal('dandean', user.username);
      done();
    });
  });

  it('should update a model on the server', function(done) {
    user.first = "Chest";
    user.save(function(e, result) {
      assert.equal(null, e);
      assert.equal(user, result);
      assert.equal('dandean', user.username);
      assert.equal('Chest', user.first);
      assert.equal('Dean', user.last);
      assert.equal('tubby@tubbs.co', user.email);
      done();
    });
  });

  it('should be filterable', function(done) {
    User.where(
      { username: "dandean" },
      function(item, args) {
        return item.username == args.username;
      },
      function(e, result) {
        assert.equal(null, e);
        assert.ok(Array.isArray(result));
        assert.equal(user, result[0]);
        assert.equal('dandean', user.username);
        assert.equal('Chest', user.first);
        assert.equal('Dean', user.last);
        assert.equal('tubby@tubbs.co', user.email);
        done();
      }
    );
  });

  it('should delete a model from the server', function(done) {
    user.delete(function(e, result) {
      assert.equal(null, e);
      assert.equal(undefined, User.dataStore.data[user.username]);
      done();
    });
  });
});
