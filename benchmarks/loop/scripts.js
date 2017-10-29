var items = [];
var total = 0;
var currentBench = "";

var add = function(num) {
  for(var i = 1; i <= num; i++) {
    items.push("item -" + ((total++) + i));
  }
}

console.time("init");

new Moon({
  root: "#app",
  data: {
    items: items
  },
  methods: {
    add: function() {
      add(1000);
      console.time((currentBench = "add 1000"));
      this.set("items", items);
    },
    addLot: function() {
      add(10000);
      console.time((currentBench = "add 10000"));
      this.set("items", items);
    },
    swap: function() {
      var i1 = Math.floor(Math.random()*items.length);
      var i2 = Math.floor(Math.random()*items.length);
      var tmp = items[i1];
      items[i1] = items[i2];
      items[i2] = tmp;
      console.time((currentBench = "swap"));
      this.set("items", items);
    },
    remove: function() {
      items.splice(Math.floor(Math.random()*items.length), 1);
      console.time((currentBench = "remove"));
      this.set("items", items);
    },
    clear: function() {
      items = [];
      console.time((currentBench = "clear"));
      this.set("items", items);
    },
    reverse: function() {
      items = items.reverse();
      console.time((currentBench = "reverse"));
      this.set("items", items);
    }
  },
  hooks: {
    init() {
      console.timeEnd("init");
    },
    updated() {
      console.timeEnd(currentBench);
    }
  }
});
