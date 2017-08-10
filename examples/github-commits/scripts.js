var apiUrl = "https://api.github.com/repos/kbrsh/moon/commits?per_page=3&sha=";

var app = new Moon({
  el: "#app",
  data: {
    branches: ["master", "gh-pages"],
    currentBranch: "master",
    commits: []
  },
  methods: {
    fetchCommits: function() {
      var branch = this.get("currentBranch");
      var self = this;

      axios.get(apiUrl + branch).then(function(response) {
        self.set("commits", response.data);
      }).catch(function(error) {
        console.log(error);
      });

    }
  },
  hooks: {
    mounted: function() {
      this.callMethod("fetchCommits", []);
    }
  }
});
