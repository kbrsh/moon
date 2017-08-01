const Firebase = require("firebase");
const path = require("path");
const express = require("express");
const app = express();

const db = Firebase.initializeApp({
  databaseURL: "https://hacker-news.firebaseio.com"
}).database().ref("/v0");

function Cached(max) {
  this.head = null;
  this.tail = null;

  this.table = {};

  this.size = 0;
  this.max = max;

  return this;
}

Cached.prototype.get = function(key) {
  return this.table[key];
}

Cached.prototype.set = function(key, value) {
  let table = this.table;
  if(table[key] === undefined) {
    if(this.head === null && this.tail === null) {
      this.head = {
        key: key,
        next: null,
        previous: null
      }

      this.tail = {
        key: key,
        next: null,
        previous: this.head
      }

      this.head.next = this.tail;
    } else if(this.size === 1) {
      this.head.key = key;
    } else {
      const head = this.head;

      this.head = {
        key: key,
        next: head,
        previous: null
      }

      head.previous = this.head;
    }

    if(this.size === this.max && this.size !== 1) {
      delete this.table[this.tail.key];
      const previous = this.tail.previous;
      this.tail.key = previous.key;
      this.tail.next = null;
      this.tail.previous = previous.previous;
      previous.previous.next = this.tail;
    } else {
      this.size++;
    }

    this.table[key] = value;
  } else {
    table[key] = value;
  }
}

Cached.prototype.has = function(key) {
  return this.table[key] !== undefined;
}

let cache = {
  topstories: [],
  newstories: [],
  showstories: [],
  askstories: [],
  jobstories: [],
  items: new Cached(500)
};

const get = (child, save) => {
  return new Promise((resolve, reject) => {
    db.child(child).once("value", (snapshot) => {
      const val = snapshot.val();
      save(val);
      resolve(val);
    });
  });
}

const watch = (child, save) => {
  db.child(child).on("value", (snapshot) => {
    save(snapshot.val());
  });
}

const getItem = (id) => {
  let items = cache.items;
  if(items.has(id) === false) {
    return get("item/" + id, (val) => {
      items.set(id, val);
    });
  } else {
    return Promise.resolve(items.get(id));
  }
}

const getList = (type, page) => {
  const end = page * 30;
  const start = end - 30;

  const cached = cache[type].slice(start, end);
  const length = cached.length;
  let list = new Array(length);

  for(let i = 0; i < length; i++) {
    list[i] = getItem(cached[i]);
  }

  return Promise.all(list);
}

watch("topstories", (data) => {
  cache.topstories = data;
});

watch("newstories", (data) => {
  cache.newstories = data;
});

watch("showstories", (data) => {
  cache.showstories = data;
});

watch("askstories", (data) => {
  cache.askstories = data;
});

watch("jobstories", (data) => {
  cache.jobstories = data;
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
	res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
	res.header("Access-Control-Allow-Headers", "OPTIONS, Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/api/item/:id", (req, res) => {
  res.json(getItem(req.params.id));
});

app.get("/api/lists/:type/:page", (req, res) => {
  getList(req.params.type, req.params.page).then((list) => {
    res.json(list);
  });
});

app.listen(3000);
