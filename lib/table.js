var r = require('rethinkdb');
var Index = require('./index');

function Table(name){
  this.$name = name;
  this.$indexes = {};
  this.get = this.get.bind(this);
}

Table.prototype.enumerable = true;

Table.prototype.$addIndex = function(name){
  var index = this.$indexes[name] = new Index(this.$name, name);
  Object.defineProperty(this, name, index);
  return index;
};

Table.prototype.get = function(){
  return Object.create(r.table(this.$name), this.$indexes);
};

module.exports = Table;