var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
chai.should();

var r = require('rethinkdb');
var Database = require('../lib/database');

suite( 'Database', function() {
  var db, connection;

  setup(function(done){
    db = new Database();
    r.connect({db:'test'}, function(err, _connection){
      connection = _connection;
      db.$connect(connection, done);
    });
  });

  test( '#$addTable', function(done) {
    db.test.should.exist;
    return done();
  });

  test( '#$addIndex', function(done) {
    db.test.test.should.exist;
    return done();
  });

  var generated_keys = [];

  test( '#run', function(done) {
    db.run('test', function(table){
      return table.insert({test: 'mock'});
    }).then(function(result){
      result.generated_keys.should.be.a('Array');
      generated_keys = result.generated_keys;
      return done();
    });
  });

  test( '#run().toArray', function(done) {
    db.run('test', function(table){
      return table.getAll(generated_keys, {index: 'test'});
    }).toArray().then(function(result){
      result.should.be.a('Array');
      return done();
    });
  });

  test( '#query', function(done) {
    db.query('test', function(table, index){
      return table.getAll(generated_keys, {index: index});
    })('test').then(function(result){
      result.should.exist;
      return done();
    });
  });

  test( '#query().toArray', function(done) {
    db.query('test', function(table, index){
      return table.getAll(generated_keys, {index: index});
    }).toArray('test').then(function(result){
      result.should.be.a('Array');
      return done();
    });
  });

  test( '#queryArray', function(done) {
    db.queryArray('test', function(table, index){
      return table.getAll(generated_keys, {index: index});
    })('test').then(function(result){
      result.should.be.a('Array');
      return done();
    });
  });

  teardown(function(done){
    connection.close(done);
  });

  
});