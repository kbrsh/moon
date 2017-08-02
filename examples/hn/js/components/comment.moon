<template>
  <div class="comment">
    <p class="by light"><router-link to="/user/{{comment.by}}" class="light">{{comment.by}}</router-link> {{time(store, comment.time)}}</p>
  </div>
</template>

<style scoped>
  .by {
    font-size: 1.5rem;
  }
</style>

<script>
  var store = require("../store/store.js").store;
  var time = require("../util/time.js");

  exports = {
    props: ["comment"],
    methods: {
      time: time
    },
    store: store
  };
</script>
