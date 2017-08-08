<template>
  <div class="wrap">
    <div class="main container background padding">
      <h5 class="title" m-if="item.url === undefined">{{item.title}}</h5>
      <h5 class="title" m-if="item.url !== undefined"><a href="{{item.url}}" class="no-decoration" rel="noopener">{{item.title}}</a> <span class="url light">({{base(item.url)}})</span></h5>
      <p class="meta light">{{pluralize(item.score, "point")}} by <router-link to="/user/{{item.by}}" class="light" rel="noopener">{{item.by}}</router-link> {{time(store, item.time)}}</p>
    </div>
    <div class="container background padding" m-if="item.descendants !== 0">
      <h6 class="comments-title">{{pluralize(item.descendants, "comment")}}</h6>
      <div class="comments" m-if="item.children !== undefined">
        <comment m-for="comment in item.children" m-literal:comment="comment"></comment>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main {
    margin-bottom: 3rem;
  }

  .title {
    font-size: 2.5rem;
  }

  .title a {
    font-size: 2.5rem;
  }

  .url {
    margin-left: 1rem;
    font-size: 1.6rem;
  }

  .comments-title {
    margin-top: 0;
    margin-bottom: 0;
    font-size: 2rem;
  }
</style>

<script>
  const store = require("../store/store.js").store;
  const base = require("../util/base.js");
  const pluralize = require("../util/pluralize.js");
  const time = require("../util/time.js");

  exports = {
    props: ["route"],
    data() {
      return {
        item: {
          title: "-",
          score: 0,
          by: "-",
          time: 0,
          url: undefined,
          descendants: 0,
          kids: []
        }
      }
    },
    methods: {
      base: base,
      pluralize: pluralize,
      time: time
    },
    hooks: {
      mounted: function() {
        window.Moon = require("moonjs")
        const store = this.get("store");
        store.dispatch("GET_ITEM", {
          id: this.get("route").params.id,
          instance: this
        });
      }
    },
    store: store
  };
</script>
