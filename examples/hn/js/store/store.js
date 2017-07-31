var Monx = require("monx");
var api = require("../util/api.js");

module.exports.store = {};

module.exports.init = function(Moon) {
  Moon.use(Monx);
  module.exports.store = new Monx({
    state: {
      lists: {
        top: []
      },
      now: Date.now() / 1000
    },
    actions: {
      "UPDATE_LISTS": function(state, info) {
        var type = info.type;

        if(type === "jobs") {
          type = "job";
        }

        api.getList(type, info.page).then(function(list) {
          state.lists[type] = list;
          info.instance.set("list", list);
        });
      }
    }
  });
}
