var Database = require('./database');
var r = require('rethinkdb');

function Index(table, name){
  this.$table = table;
  this.$name = name;
  this.get = this.get.bind(this);
}

Index.prototype.enumerable = true;

Index.prototype.get = function(){
  var table = r.table(this.$table);
  var name = this.$name;
  return function(key){
    return table.getAll(key, {index: name});
  };
};

module.exports = Index;