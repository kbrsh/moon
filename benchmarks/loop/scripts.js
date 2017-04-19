var items = [];

var add = function(num) {
  for(var i = items.length ? items.length - 1 : 0, num = items.length - 1 + num; i < num; i++) {
    items.push("item - " + i);
  }
}

console.time('init');
var app = new Moon({
  el: "#app",
  data: {
    items: items
  },
  methods: {
    add: function() {
      add(1000);
      console.time('add 1000');
      this.set('items', items);
      Moon.nextTick(function() {
        console.timeEnd('add 1000');
      });
    },
    addLot: function() {
      add(10000);
      console.time('add 10000');
      this.set('items', items);
      Moon.nextTick(function() {
        console.timeEnd('add 10000');
      });
    },
    swap: function() {
      var i1 = Math.floor(Math.random()*items.length);
      var i2 = Math.floor(Math.random()*items.length);
      var tmp = items[i1];
      items[i1] = items[i2];
      items[i2] = tmp;
      console.time('swap');
      this.set('items', items);
      Moon.nextTick(function() {
        console.timeEnd('swap');
      });
    },
    remove: function() {
      items.splice(Math.floor(Math.random()*items.length), 1);
      console.time('remove');
      this.set('items', items);
      Moon.nextTick(function() {
        console.timeEnd('remove');
      });
    },
    clear: function() {
      items = [];
      console.time('clear');
      this.set('items', items);
      Moon.nextTick(function() {
        console.timeEnd('clear');
      });
    },
    reverse: function() {
      items = items.reverse();
      console.time('reverse');
      this.set('items', items);
      Moon.nextTick(function() {
        console.timeEnd('reverse');
      });
    }
  }
})
console.timeEnd('init')
