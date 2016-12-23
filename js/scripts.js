var app = new Moon({
  el: '#app',
  data: {
    msg: 'Hello Moon!'
  }
});

var app2 = new Moon({
  el: '#app2',
  data: {
    msg: 'Hello Moon!'
  }
});

var app3 = new Moon({
  el: '#app3',
  data: {
    msg: 'Hello Moon!'
  },
  methods: {
    change: function() {
      app3.$set('msg', 'Changed the Value!');
    }
  }
});

app3.$method('change');
