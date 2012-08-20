Tubbs-RestStorage
=================

Tubbs-RestStorage is a REST adaptor for [Tubbs](https://github.com/dandean/tubbs).

Example:
--------

```js
var Tubbs = require('tubbs');
var RestStorage = require('tubbs-reststorage');

var User = Tubbs.create({

  // Persist our data via Rest
  dataStore: new RestStorage({
    url: '/users',
    headers: { 'X_CSRF_TOKEN': 'b0113d8b-a4b3-c7db-0ec4-c0eb9c02e3a3' }
  }),

  // ...

});

User.fetch(function(e, result) {
  // User data is ready for use locally.
});

```

See [Tubbs](https://github.com/dandean/tubbs) for more information.
