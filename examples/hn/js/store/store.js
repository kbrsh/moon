var Monx = require("monx");
var api = require("../util/api.js").api;

module.exports.store = {};

module.exports.init = function(Moon) {
  Moon.use(Monx);
  module.exports.store = new Monx({
    state: {
      lists: {
        top: []
      }
    },
    actions: {
      "UPDATE_LISTS": function(state, info) {
        var type = info.type;
        var page = info.page;

        if(type === "jobs") {
          type = "job";
        }

        var end = page * 30;
        var start = end - 30;

        api.getList(type).then(function(ids) {
          api.getItems(ids).then(function(list) {
            var current = list.slice(start, end);
            state.lists[type] = current;
            info.instance.set("list", current);
          });
        });
      }
    }
  });
}
