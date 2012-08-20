var assert = require('assert');
var Guid = require('guid');
var Tubbs = require('tubbs');
var RiakStore = require('../index');

describe("RiakStore", function() {

  var User;

  before(function() {
    User = Tubbs.create({
    
      // Persist our data with Riak
      dataStore: new RiakStore({ bucket: 'users' }),
      
      primaryKey: 'username',
    
      fields: {
        username: undefined,
        password: undefined,
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

  it('should be able to find a document with search terms', function(done) {
    User.where(
      {
        username: "dandean3",
        email: "me@dandean.com"
      },
      function(doc, args) {
        return doc.username == args.username && doc.email == args.email;
      },
      function(e, result) {
        done();
      }
    );
  });

  it('should be able to get all documents', function(done) {
    // TODO: rework this test to make it useful...

    User.all(function(e, results) {
      console.log(e, results);
      
      User.find('60164656-6f7a-80b7-f9f1-5c74b8920809', function(e, results) {
        console.log(e, results);
        
        User.where(
          function(doc) {
            return doc.id == '60164656-6f7a-80b7-f9f1-5c74b8920809';
          },
          function(e, results) {
            console.log(e, results);
            
            var record = results[0];
            record.id = Guid.raw();
            
            record.save(function(e, result) {
              console.log(e, result);
              
              record.delete(function(e, result) {
                console.log(e, result);
                
                User.find(record.id, function(e, result) {
                  console.log(e, result);
                });
              });
            });
          }
        );
      });
    });
  });

});
