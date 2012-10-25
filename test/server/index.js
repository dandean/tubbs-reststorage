// This file will get compiled by Modulr and served as /tubbs.js
var assert = require('assert');
var Tubbs = require('tubbs');
var RestStorage = require('../../index');

// Export the require function for easy console debugger.
window.__require = require;

/**
 * underscore(str) -> String
 *
 * Converts a camelCase string to snake_case. Taken and modified from here:
 * http://api.prototypejs.org/language/String/prototype/underscore/
**/
function underscore(str) {
  var result = str
    .replace(/(,|{)(\s*")([a-z0-9]+)(":)/ig, function(match, separator, prefix, key, suffix, offset, value) {
      key = key.replace(/([A-Z]+)([A-Z][a-z])/g, function(match, part1, part2) { return (part1 + '_' + part2).toLowerCase(); })
               .replace(/([a-z\d])([A-Z])/g, function(match, part1, part2) { return (part1 + '_' + part2).toLowerCase(); });
      return separator + prefix + key + suffix;
    });
  return result;
}

/**
 * camelize(str) -> String
 *
 * Converts a snake_case string to camelCase. Taken and modified from here:
 * http://api.prototypejs.org/language/String/prototype/camelize/
**/
function camelize(str) {
  if (!str || (str && !str.match(/_/))) return str;
  var result = str.replace(/(,|{)(\s*")([a-z0-9]+_\w+)(":)/g, function(match, separator, prefix, key, suffix, offset, value) {
    return separator + prefix + key.replace(/_+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    }) + suffix;
  });
  return result;
}


describe('RestStorage', function() {

  var User, user;

  before(function() {
    User = function(data) {
      this.setData(data);
    };

    Tubbs(User, {
      // Persist our data via REST
      dataStore: new RestStorage(User, {
        url: '/users',
        parse: function(response) {
          return JSON.parse(camelize(response));
        },
        serialize: function(payload) {
          return underscore(JSON.stringify(payload));
        }
      }),
      primaryKey: 'username',
      basicProperties: ['username', 'firstName', 'lastName', 'email']
    });

    Object.defineProperty(User, 'fullname', {
      get: function() {
        return ((this.firstName || '') + ' ' + (this.lastName || '')).trim();
      },
      enumerable: true
    });

  });

  it('should fetch data from the server', function(done) {
    User.fetch(function() {
      User.all(function(e, result) {
        assert.ok(result.length > 0);
        done();
      })
    });
  });

  it('should save a new model to the server', function(done) {
    user = new User({
      firstName: "Dan",
      lastName: "Dean",
      email: "tubby@tubbs.co"
    });

    assert.ok(user.isNew);
    assert.ok(user.id.match(/^cid\d+$/));

    user.save(function(e, result){
      assert.equal(null, e);
      assert.equal(user, result);
      assert.equal('dandean', user.username);
      assert.equal('Dan', user.firstName);
      assert.equal('Dean', user.lastName);
      assert.equal('tubby@tubbs.co', user.email);
      done();
    });
  });

  it('should find a model in the collection', function(done) {
    user = new User({
      firstName: "Dan",
      lastName: "Dean",
      email: "tubby@tubbs.co"
    });

    user.save(function(e, saveResult){
      User.find('dandean', function(e, findResult) {
        assert.equal(null, e);
        assert.equal(user, findResult);
        assert.equal('dandean', findResult.username);
        done();
      });
    });
  });

  it('should update a model on the server', function(done) {
    User.find('dandean', function(e, findResult) {
      findResult.firstName = "Chest";
      findResult.save(function(e, saveResult) {
        assert.equal(null, e);
        assert.equal(findResult, saveResult);
        assert.equal('dandean', saveResult.username);
        assert.equal('Chest', saveResult.firstName);
        assert.equal('Dean', saveResult.lastName);
        assert.equal('tubby@tubbs.co', saveResult.email);
        done();
      });
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
        assert.equal('Chest', user.firstName);
        assert.equal('Dean', user.lastName);
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
