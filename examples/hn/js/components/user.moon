<template>
  <div class="container background padding">
    <h5 class="title">{{user.id}}</h5>
    <p class="meta light">joined {{time(store, user.created)}} | {{user.karma}} karma</p>
    <p class="meta light"><a href="https://news.ycombinator.com/submitted?id={{user.id}}" class="light" rel="noopener">submissions</a> | <a href="https://news.ycombinator.com/threads?id={{user.id}}" class="light" rel="noopener">comments</a></p>
    <p class="info" m-if="user.about" m-html="user.about"></p>
  </div>
</template>

<style scoped>
  .info {
    color: #111111;
  }
</style>

<script>
  const store = require("../store/store.js").store;
  const time = require("../util/time.js");

  exports = {
    props: ["route"],
    data() {
      return {
        user: {
          id: "-",
          created: 0,
          karma: 0,
          about: undefined
        }
      }
    },
    methods: {
      time: time
    },
    hooks: {
      mounted: function() {
        const store = this.get("store");
        store.dispatch("GET_USER", {
          id: this.get("route").params.id,
          instance: this
        });
      }
    },
    store: store
  };
</script>
