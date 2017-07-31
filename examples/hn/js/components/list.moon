<template>
  <div class="container list">
    <div class="container background">
      <div class="item" m-for="item in list">
        <div class="count-container">
          <span class="count">{{item.score}}</span>
        </div>
        <div class="right-half">
          <div class="title-container">
            <a class="title no-decoration" href="{{item.url}}" rel="noopener">{{item.title}}</a>
            <p class="url" m-if="item.url !== undefined">({{base(item.url)}})</p>
          </div>
          <p class="meta">by {{item.by}} {{time(item.time)}}<span m-if="item.descendants !== undefined"> | <router-link to="/item/{{item.id}}" rel="noopener" class="comments">{{item.descendants}} comments</router-link></span></p>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
  .list {
    height: 100%;
    padding-top: 30px;
    background-color: #FDFDFD;
  }

  .item {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 50px;
  }

  .count-container {
    text-align: center;
    width: 70px;
  }

  .count {
    color: #666666;
    font-weight: 100;
    font-size: 2.5rem;
  }

  .title-container {
    /*line-height: 1.6;*/
  }

  .title {
    margin-top: 0;
    margin-bottom: 0;
    color: #111111;
    font-weight: 400;
    font-size: 1.5rem;
  }

  .url {
    display: inline-block;
    margin-top: 0;
    margin-bottom: 0;
    color: #666666;
    font-size: 1.2rem;
  }

  .meta {
    margin-top: 0;
    margin-bottom: 0;
    color: #666666;
    font-size: 1rem;
  }

  .comments {
    color: #666666;
    text-decoration: none;
  }

  .right-half {
    display: flex;
    flex-direction: column;
  }
</style>
<script>
  var store = require("../store/store.js").store;
  var MINUTE = 60;
  var HOUR = 3600;
  var DAY = 86400;

  var hostnameRE = /([\w\d-]+\.[\w\d-]+)(?:\/[\w\d-/.?=#&%@;]*)?$/;

  var info = {
    type: "",
    page: 0
  };

  exports = {
    props: ["route"],
    data: function() {
      return {
        list: []
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
          info.type = type;
          info.page = page;
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
      updated: function() {
        this.callMethod("update", []);
      }
    },
    store: store
  }
</script>
