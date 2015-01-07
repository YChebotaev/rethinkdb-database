var r = require('rethinkdb');
var Table = require('./table');

function Database(connection, callback){
  this.$name = null;
  this.$tables = {};
  this.$readyCallbacks = [];
  this.connection;
  if (connection != null){
    this.$connect(connection, callback);
  }
}

Object.defineProperty(Database.prototype, 'ready', {
  set: function(callback){
    if (this.$readyCallbacks === false){
      callback(this, this.connection);
    } else {
      this.$readyCallbacks.push(callback);
    }
  },
  get: function(){
    return this.$readyCallbacks !== false;
  }
});

Database.connect = function(config, _callback){
  var callback = typeof _callback === 'function' ? _callback : function(){};
  var db = new Database();
  db.$name = config.db;
  r.connect(config, function(err, connection){
    if (err != null) return callback(err);
    db.$connect(connection, callback);
  });
  return db;
};

Database.prototype.$ready = function(){
  if (this.$readyCallbacks !== false){
    for (var i=0, l=this.$readyCallbacks.length; i<l; i++){
      var callback = this.$readyCallbacks[i];
      callback(this, this.connection);
    }
    this.$readyCallbacks = false;
  }
};

Database.prototype.$init = function(callback){
  var self = this;

  function init(err, infoList){
    if (err != null) return callback(err);

    infoList.forEach(function(info){
      var table = self.$addTable(info.name, info.indexes);
      table.$addIndex(info.primary_key);
    }, self);

    self.$ready();
    return typeof callback === 'function' && callback(err, self, self.connection);
  };

  this.$ensure().tableList().map(function(tableName){
    return r.table(tableName).info();
  }).run(this.connection, init);

  return this;
};

Database.prototype.$connect = function(connection, _callback){
  var callback = typeof _callback === 'function' ? _callback : function(){};
  this.connection = connection;
  this.$name = connection.db;
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

Database.prototype.$ensure = function(){
  var dbName = this.$name;
  return r
    .dbList()
    .contains(dbName)
    .do(r.branch(r.row, r.db(dbName), r.do(function(){
      return r.dbCreate(dbName).do(function(){
        return r.db(dbName);
      });
    })));
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