<template>
  <div class="container background">
    <div class="item" m-for="item,index in list">
      <p class="count light">{{(index + info.offset)}}</p>
      <div class="right-half">
        <p class="title" m-if="item.url === undefined"><router-link to="/item/{{item.id}}" class="no-decoration" rel="noopener">{{item.title}}</router-link></p>
        <p class="title" m-if="item.url !== undefined"><a href="{{item.url}}" class="no-decoration" rel="noopener">{{item.title}}</a> <span class="light">({{base(item.url)}})</span></p>
        <p class="meta light">{{item.score}} points by <router-link to="/users/{{item.by}}" class="light">{{item.by}}</router-link> {{time(item.time)}}<span m-if="item.descendants !== undefined"> | <router-link to="/item/{{item.id}}" rel="noopener" class="light">{{item.descendants}} comments</router-link></span></p>
      </div>
    </div>
    <router-link to="/{{info.type}}/{{(info.page + 1)}}" class="light">Next</router-link>
  </div>
</template>
<style scoped>
  .item {
    display: flex;
  }

  .count {
    flex: 0 0 70px;
    margin-top: auto;
    margin-bottom: auto;
    font-weight: 100;
    font-size: 2.5rem;
    text-align: center;
  }

  .right-half {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  .title {
    margin-top: 0;
    margin-bottom: 0;
  }

  .title a {
    color: #111111;
    font-size: 1.5rem;
  }

  .url {
    font-size: 1.2rem;
  }

  .meta {
    margin-top: 0;
    margin-bottom: 0;
    font-size: 1rem;
  }
</style>
<script>
  var store = require("../store/store.js").store;
  var MINUTE = 60;
  var HOUR = 3600;
  var DAY = 86400;

  var hostnameRE = /([\w\d-]+\.[\w\d-]+)(?:\/[\w\d-/.?=#&%@;+]*)?$/;

  var info = {
    type: "",
    page: 0,
    offset: 0
  };

  exports = {
    props: ["route"],
    data: function() {
      return {
        list: [],
        info: info,
        parseInt: parseInt
      }
    },
    methods: {
      update: function() {
        var params = this.get("route").params;
        var type = params.type;
        var page = params.page;

        if(type === undefined) {
          type = "top";
        }

        if(page === undefined) {
          page = 1;
        }

        if((type !== info.type) || (page !== info.page)) {
          var store = this.get("store");
          page = parseInt(page, 10);

          info.type = type;
          info.page = page;
          info.offset = (page * 30) - 29;
          store.dispatch("UPDATE_LISTS", {
            type: type,
            page: page,
            instance: this
          });
        }
      },
      base: function(url) {
        return hostnameRE.exec(url)[1];
      },
      time: function(posted) {
        var difference = store.state.now - posted;
        var unit = " minute";
        var passed = 0;

        if(difference < HOUR) {
          passed = difference / MINUTE;
        } else if(difference < DAY) {
          passed = difference / HOUR;
          unit = " hour";
        } else {
          passed = difference / DAY;
          unit = " day";
        }

        passed = passed | 0;

        if(passed > 1) {
          unit += "s";
        }

        return passed + unit + " ago";
      }
    },
    hooks: {
      mounted: function() {
        this.callMethod("update", []);
      },
      updated: function() {
        this.callMethod("update", []);
      }
    },
    store: store
  }
</script>
