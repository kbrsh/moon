const Monx = require("monx");
const api = require("../util/api.js");

module.exports.store = {};

module.exports.init = function(Moon) {
  Moon.use(Monx);
  module.exports.store = new Monx({
    state: {
      now: Date.now() / 1000
    },
    actions: {
      "UPDATE_LISTS": (state, info) => {
        const instance = info.instance;
        let type = info.type;
        const page = info.page;

        if(type === "jobs") {
          type = "job";
        }

        api.getList(type, page).then(function(data) {
          instance.set("next", data.next);
          instance.set("list", data.list);
        });
      },
      "GET_ITEM": (state, info) => {
        const instance = info.instance;
        const id = info.id;

        api.getItem(id).then(function(item) {
          item.children = undefined;
          instance.set("item", item);

          api.getComments(id).then(function(comments) {
            let i = comments.length;
            while((i--) !== 0) {
              if(comments[i].deleted === true) {
                comments.splice(i, 1);
              }
            }
            item.children = comments;
            instance.set("item", item);
          });
        });
      },
      "GET_USER": (state, info) => {
        const instance = info.instance;
        const id = info.id;

        api.getUser(id).then(function(user) {
          instance.set("user", user);
        });
      }
    }
  });
}
