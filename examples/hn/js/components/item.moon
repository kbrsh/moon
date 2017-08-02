<template>
  <div class="container background">
    <p class="title" m-if="item.url === undefined">{{item.title}}</p>
    <p class="title" m-if="item.url !== undefined"><a href="{{item.url}}" class="no-decoration" rel="noopener">{{item.title}}</a> <span class="url light">({{base(item.url)}})</span></p>
  </div>
</template>

<style scoped>
  .container.background {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 3rem;
  }

  .title {
    display: flex;
    align-items: center;
  }

  .title a {
    font-size: 2.5rem;
  }

  .url {
    margin-left: 1rem;
    font-size: 1.6rem;
  }


</style>

<script>
  var store = require("../store/store.js").store;
  var base = require("../util/base.js");
  var time = require("../util/time.js");

  exports = {
    props: ["route"],
    data: function() {
      return {
        item: {
          title: "-",
          url: undefined
        }
      }
    },
    methods: {
      base: base,
      time: time
    },
    hooks: {
      mounted: function() {
        var store = this.get("store");
        store.dispatch("GET_ITEM", {
          id: this.get("route").params.id,
          instance: this
        });
      }
    },
    store: store
  };
</script>
