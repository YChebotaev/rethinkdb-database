rethinkdb-database
==================

a module that defines much pretty api to interact with `rethinkdb` connection

usage
-----

```javascript
var Db = require('rethinkdb-database');

// simple connection helper
var db = Db.connect({db:'test'}, function(err, db, connection){
  // ...
});
// full equivalent to:
r.connect({db:'test'}, function(err, connection){
  db = new Db(connection, function(err, db, connection){
    // You should always wait for Db is initialized
  });
  // which is also can be written as follow:
  db = new Db();
  db.$connect(connection, function(err, db, connection){
    // ...
  });
});
```

after connection callback is fired, you will able to access to tables and indexes by name:

```javascript

Db.connect({db:'test'}, function(err, db){

  // let's assume that you have table `test.foo`:

  db.foo.get('570dd7e5-218a-487c-8edf-1dcdecb13d51').run();

  db.run('foo', function(table){
    return table.get('6dd1323d-fa6b-42f3-ac69-ba2fb68b86fe');
  }).then(function(row){
    // ...
  });

  var fn = db.query('foo', function(table, id){
    return table.get(id);
  });

  fn('ce7dbec6-afbc-422d-a6b8-40e6b3e13121').then(function(row){
    // ...
  });

  db.query('foo', function(table, id){
    return table.getAll(id, {index: 'id'});
  }).toArray('a3ec1fea-b9c5-4fb0-90c6-455650885e8e').then(function(array){
    // ...
  });

  db.queryArray('foo', function(table, id){
    return table.getAll(id, {index: 'id'});
  })('c4c77dc2-942d-42c3-8397-0f1406855444').then(function(array){});

  db.run('foo', function(table){
  return table.getAll('5d71dd8e-e1c6-4949-95e3-e27c512f22c1', {index: 'id'});
  }).toArray().then(function(row){});

```