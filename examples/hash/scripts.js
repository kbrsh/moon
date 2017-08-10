new Moon({
  el: "#app",
  data: {
    text: "Moon"
  },
  computed: {
    hash: {
      get: function() {
        return Slash(this.get("text"));
      }
    }
  }
});
