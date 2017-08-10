var debounce = function(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;

    var later = function() {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    var callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait || 200);
    if(callNow === true) {
      func.apply(context, args);
    }
  };
};

var app = new Moon({
  el: "#app",
  data: {
    input: "# Hello Moon",
  },
  methods: {
    update: debounce(function(evt) {
      this.set("input", evt.target.value);
    }, 100)
  },
  computed: {
    html: {
      get: function() {
        return marked(this.get("input"));
      }
    }
  }
});
