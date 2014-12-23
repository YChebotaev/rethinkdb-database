var r = require('rethinkdb');
var Table = require('./table');

function Database(connection, callback){
  this.$tables = {};
  this.connection;
  if (connection != null){
    this.$connect(connection, callback);
  }
}

Database.connect = function(config, callback){
  r.connect(config, function(err, connection){
    if (err != null) return callback(err);
    var db = new Database(connection, callback);
  });
};

Database.prototype.$init = function(callback){
  var self = this;

  function init(err, infoList){
    if (err != null) return callback(err);

    infoList.forEach(function(info){
      var table = self.$addTable(info.name, info.indexes);
      table.$addIndex(info.primary_key);
    }, self);

    return typeof callback === 'function' && callback(err, self, self.connection);
  };

  r.tableList().map(function(tableName){
    return r.table(tableName).info();
  }).run(this.connection, init);

  return this;
};

Database.prototype.$connect = function(connection, callback){
  this.connection = connection;
  this.$init(callback);
}

Database.prototype.$addTable = function(name, indexes){
  var table = this.$tables[name] = new Table(name);
  if (Array.isArray(indexes) && indexes.length > 0){
    indexes.forEach(table.$addIndex, table);
  }
  Object.defineProperty(this, name, table);
  return table;
};

Database.prototype.$addIndex = function(table, index){
  if (this.$tables[table] != null){
    this.$tables[table].$addIndex(index);
  } else {
    this.$addTable(table, [index]);
  }
  return this;
};

Database.prototype.run = function(_table, _query){
  var table, query, promise, runner;
  if (typeof _table === 'function'){
    query = _table;
    table = r;
  } else {
    query = _query;
    table = r.table(_table);
  }

  promise = query(table).run(this.connection);

  promise.toArray = function(){
    return promise.then(function(cursor){
      return cursor.toArray();
    })
  };

  return promise;
};

Database.prototype.query = function(_table, _query, ctx){
  var self = this;
  var table, query, wrapped, runner;
  if (typeof _table === 'function'){
    query = _table;
    table = r;
  } else {
    query = _query;
    table = r.table(_table);
  }

  wrapped = function wrapped(){
    var args = [table];
    for (var i=0, l=arguments.length; i<l; i++){
      args[i+1] = arguments[i];
    }
    return query.apply(ctx, args).run(self.connection);
  };

  wrapped.toArray = function(){
    return wrapped.apply(this, arguments).then(function(cursor){
      return cursor.toArray();
    });
  }

  return wrapped;
};

Database.prototype.queryArray = function(){
  return this.query.apply(this, arguments).toArray;
}

module.exports = Database;