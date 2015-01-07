var r = require('rethinkdb');
var Index = require('./index');

function Table(name, db, virtual){
  this.$virtual = virtual === true ? virtual : false;
  this.$db = db;
  this.$name = name;
  this.$dbName = db.$name;
  this.$indexes = {};
  this.get = this.get.bind(this);
}

Table.prototype.enumerable = true;

Table.prototype.$addIndex = function(name){
  var index = this.$indexes[name];
  if (index == null){
    index = this.$indexes[name] = new Index(this.$name, name);
    Object.defineProperty(this, name, index);
  }
  return index;
};

Table.prototype.$ensure = function(){
  var table = r.db(this.$dbName).table(this.$name);
  if (this.$virtual){
    this.$virtual = false;
    return this.$db.$ensure()
      .tableList()
      .contains(this.$name)
      .do(r.branch(r.row, table, r.do(function(){
        return table;
      })));
  } else {
    return table;
  }
};

Table.prototype.get = function(){
  var query;
  if (this.$virtual){
    query = this.$ensure();
  } else {
    query = r.table(this.$name);
  }
  return Object.create(query, this.$indexes);
};

module.exports = Table;