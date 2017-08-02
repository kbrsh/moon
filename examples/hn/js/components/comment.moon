<template>
  <div class="comment">
    <p class="by light"><router-link to="/user/{{comment.by}}" class="light">{{comment.by}}</router-link> {{time(store, comment.time)}}</p>
    <p class="comment-content" m-html="comment.text"></p>
    <div class="comments" m-if="comment.children !== undefined">
      <comment m-for="kid in comment.children" m-literal:comment="kid"></comment>
    </div>
  </div>
</template>

<style scoped>
  .comment {
    margin-bottom: 3rem;
  }

  .by {
    font-size: 1.5rem;
  }

  .comment-content {
    color: #111111;
    font-size: 1.5rem;
  }

  .comments {
    margin-left: 3rem;
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
