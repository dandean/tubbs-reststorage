var express = require('express');
var app = express();
var exec = require('child_process').exec;
var fs = require('fs');

app.use(express.bodyParser());

var file = function(path) {
  return fs.readFileSync(path, 'utf8');
};

app.all('*', function(req, res, next) {
  // debugger;
  // Do not cache any resources from this server.
  res.header('Cache-Control', 'no-cache');
  next();
});

//
// RESOURCES
//

var DB = {
  "rad": {
    "username": 'rad',
    "first": 'Rad',
    "last": 'Radical',
    "email": 'rad@radical.com'
  }
};

// CSS
app.get('/mocha.css', function(req, res) {
  res.type('css');
  res.send(file('./node_modules/mocha/mocha.css'));
});

// Mocha
app.get('/mocha.js', function(req, res) {
  res.type('text/javascript');
  res.send(file('./node_modules/mocha/mocha.js'));
});

// Client-side JavaScript
app.get('/tubbs.js', function(req, res) {
  exec('browserify test/server/index.js -d', function(e, stdout, stderr) {
    if (e) throw e;

    if (stderr) console.log(stderr);

    res.type('text/javascript');
    res.send(stdout);
  });
});

// HTML
app.get('/', function(req, res) {
  res.send(file('./test/server/index.html'))
});

//
// REST ENDPOINTS
//

app.get('/not-json', function(req, res) {
  res.type('crap/hell');
  res.send('This is not JSON.');
});

// Get all users (fetch)
app.get('/users', function(req, res){
  res.send(DB);
});

// Get a specific user
app.get('/users/:id', function(req, res) {
  var user = DB[req.params.id];
  res.status(user ? 200 : 404).send(user);
});

// Create a new user
app.post('/users', function(req, res){
  var user = req.body;
  var id = (user.first + user.last).toLowerCase();
  user.username = id;
  DB[id] = user;
  res.send(user);
});

// Update a user
app.put('/users/:id', function(req, res){
  var user = DB[req.params.id];

  if (!user) {
    res.status(404).send({});
    return;
  }

  var data = req.body;
  Object.keys(data).forEach(function(name) {
    if (name != 'username') user[name] = data[name];
  });

  res.send(DB[req.params.id] = data);
});

// Delete a user
app.delete('/users/:id', function(req, res){
  var user = DB[req.params.id];
  res.status(user ? (delete DB[req.params.id], 200) : 404).send({});
});

// Start the server
app.listen(3000);
console.log('Server started at http://localhost:3000/');
