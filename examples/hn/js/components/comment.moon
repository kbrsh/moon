<template>
  <div class="comment">
    <p m-literal:class="{'by': true, 'light': true, 'italic': !open}"><button m-on:click="toggle" class="toggle light">[{{(open === true ? "-" : "+")}}]</button><router-link to="/user/{{comment.by}}" class="light" rel="noopener">{{comment.by}}</router-link> {{time(store, comment.time)}}</p>
    <div class="wrap" m-show="open">
      <p class="comment-content" m-html="comment.text"></p>
      <div class="comments" m-if="comment.children !== undefined">
        <comment m-for="kid in comment.children" m-literal:comment="kid"></comment>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .comment {
    margin-bottom: 3rem;
  }

  .toggle {
    padding: 0;
    margin-right: 1rem;
    border: none;
    background: none;
  }

  .toggle:hover {
    cursor: pointer;
  }

  .by {
    font-size: 1.5rem;
  }

  .by.italic {
    font-style: italic;
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
    data: function() {
      return {
        open: true
      }
    },
    methods: {
      toggle: function() {
        this.set("open", !this.get("open"));
      },
      time: time
    },
    store: store
  };
</script>
