function Cached(max) {
  this.head = null;
  this.tail = null;

  this.table = {};

  this.size = 0;
  this.max = max;

  return this;
}

Cached.prototype.get = function(key) {
  return this.table[key];
}

Cached.prototype.set = function(key, value) {
  let table = this.table;
  if(table[key] === undefined) {
    if(this.head === null && this.tail === null) {
      this.head = {
        key: key,
        next: null,
        previous: null
      }

      this.tail = {
        key: key,
        next: null,
        previous: this.head
      }

      this.head.next = this.tail;
    } else if(this.size === 1) {
      this.head.key = key;
    } else {
      const head = this.head;

      this.head = {
        key: key,
        next: head,
        previous: null
      }

      head.previous = this.head;
    }

    if(this.size === this.max && this.size !== 1) {
      delete this.table[this.tail.key];
      let previous = this.tail.previous;
      this.tail.key = previous.key;
      this.tail.next = null;
      this.tail.previous = previous.previous;
      previous.previous.next = this.tail;
    } else {
      this.size++;
    }

    this.table[key] = value;
  } else {
    table[key] = value;
  }
}

Cached.prototype.has = function(key) {
  return this.table[key] !== undefined;
}

module.exports = Cached;
