var express = require('express');
var app = express();
var exec = require('child_process').exec;
var fs = require('fs');

app.use(express.bodyParser());

var file = function(path) {
  return fs.readFileSync(path, 'utf8');
};

app.all('*', function(req, res, next) {
  // Do not cache any resources from this server.
  res.header('Cache-Control', 'no-cache');
  next();
});

//
// RESOURCES
//

function getDummyUser() {
  return {
    username: 'dandean',
    first: 'Dan',
    last: 'Dean',
    email: 'tubby@tubbs.co'

  };
}

app.get('/mocha.css', function(req, res) {
  res.type('css');
  res.send(file('./node_modules/mocha/mocha.css'));
});

app.get('/mocha.js', function(req, res) {
  res.type('text/javascript');
  res.send(file('./node_modules/mocha/mocha.js'));
});

app.get('/tubbs.js', function(req, res) {
  exec('browserify test/server/index.js -d', function(e, stdout, stderr) {
    if (e) throw e;

    if (stderr) console.log(stderr);

    res.type('text/javascript');
    res.send(stdout);
  });
});

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

app.get('/users', function(req, res){
  res.send([getDummyUser()]);
});

// Get a specific user
app.get('/users/:id', function(req, res) {
  var user = getDummyUser();
  user.username = req.params.id;
  res.send(user);
});

// Create a new user
app.post('/users', function(req, res){
  var user = req.body;
  user.username = (user.first + user.last).toLowerCase();
  res.send(user);
});

// Update a user
app.put('/users/:id', function(req, res){
  req.body.email = 'hahahahah';
  res.send(req.body);
});

// Delete a user
app.delete('/users/:id', function(req, res){
  res.send({});
});

app.listen(3000);
console.log('Server started at http://localhost:3000/');
