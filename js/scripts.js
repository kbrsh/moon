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
      app3.set('msg', 'Changed the Value!');
    }
  }
});

app3.method('change');

var app4 = new Moon({
  el: '#app4',
  data: {
    msg: 'Hello Moon!'
  },
  hooks: {
    created: function() {
      console.log('App 4 Created!');
    },
    mounted: function() {
      console.log('App 4 Mounted!');
    },
    updated: function() {
      console.log('App 4 Updated!');
    },
    destroyed: function() {
      console.log('App 4 Destroyed!');
    }
  }
});
