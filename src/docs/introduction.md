---
title: Introduction
order: 2
---

#### What is Moon?

Moon is a minimal, blazing fast library for building user interfaces. It's super lightweight, and includes advanced optimizations to ensure fast render times. It's easy to learn, whether you come from Vue, Angular, React, Ractive, Mithril, or Vanilla.

For example, here is the minified + gzipped size for popular libraries compared to Moon (less is better):

- Moon - 4.9kb
- Mithril - 8kb
- Vue - 25.86kb
- React + React DOM - 43kb
- Angular 2 - 111kb

Update performance (more is better):

- Moon - 102 repaints/sec
- Mithril - 95 repaints/sec
- Angular 2 - 62 repaints/sec
- Vue - 50 repaints/sec
- React - 49 repaints/sec
- Angular - 47 repaints/sec

As you can see, Moon is blazing fast compared to other popular libraries.

Moon can also support IE9+ without any polyfils.

#### Getting Started

This introduction guide will get you started building basic applications with Moon in no time, to get started, create an HTML file and put this into it:

```html
<body>
  <script src="https://unpkg.com/moonjs@0.4.6"></script>
  <script>
    // Our Code Goes Here
  </script>
</body>
```

Now just follow along!

#### Initialization

First, let's create a new **Moon Instance**, this is where all our options for Moon go, and where we initialize it.

```js
var app1 = new Moon({
  el: "#app1",
  data: {
    msg: "Hello Moon!"
  }
});
```

The `el` option is recognized by Moon, and Moon mounts itself onto this element.

The `data` option is also recognized by Moon, this is an object where we can store all of our data, this data can be updated at any time, and Moon makes the necessary changes to the DOM in real-time!

Let's show the user this message, by adding this to the HTML:

```html
<div id="app1">
  <p>{{msg}}</p>
</div>
```

Notice the `{{mustache}}` syntax? This is used to interpolate properties in the `data` your provide. Moon analyzes these and will update this element every time you change the `msg` property.

We should now have something that looks like this:

<div id="app1" class="example">
  <p>{{msg}}</p>
</div>

<script>
  var app1 = new Moon({
    el: "#app1",
    data: {
      msg: "Hello Moon!"
    }
  });
</script>

#### Changing Data

Moon can update the DOM as a result of you changing the data. To change data, you use an **instance method** called `set`. You can know do something like:

```html
<div id="app2">
  <p>{{msg}}</p>
</div>
```

```js
var app2 = new Moon({
  el: "#app2",
  data: {
    msg: "Hello Moon!"
  }
});

app2.set('msg', "Changed Message!");
```

<div id="app2" class="example">
  <p>{{msg}}</p>
</div>

<script>
  var app2 = new Moon({
    el: "#app2",
    data: {
      msg: "Hello Moon!"
    }
  });
  app2.set('msg', "Changed Message!");
</script>

Go ahead, try entering `app2.set('msg', 'New Message!')` in the console!

#### Methods

Methods allow you to reuse code throughout your Moon applications. You can put them in the `methods` option when initializing the Moon instance. To call these methods, we use the `callMethod` function, this takes the method to call as the first parameter, and any arguments as an array in the second parameter.

You have to use the `callMethod` function every time you call a method, or else `this` won't be available as a reference to the instance.

```html
<div id="app3">
  <p>{{msg}}</p>
</div>
```

```js
var app3 = new Moon({
  el: "#app3",
  data: {
    msg: "Hello Moon!"
  },
  methods: {
    changeMessage: function(msg) {
      this.set('msg', msg);
    }
  }
});

app3.callMethod('changeMessage', ['New Message!']);
```

<div id="app3" class="example">
  <p>{{msg}}</p>
</div>

<script>
var app3 = new Moon({
  el: "#app3",
  data: {
    msg: "Hello Moon!"
  },
  methods: {
    changeMessage: function(msg) {
      this.set('msg', msg);
    }
  }
});
app3.callMethod('changeMessage', ['New Message!']);
</script>

Go ahead, try entering `app3.callMethod('changeMessage', ['Calling a Method!']);` in the console!

#### Conditional Rendering

Let's get started with our first _directive!_ Directives are ways of adding special behavior to elements. Right now, we are going to use `m-if`. This lets us put in any data, including `{{mustache}}` templates into the directive as an attribute. If it is truthy, it will be rendered, if it is falsy, it won't be rendered (the element won't exist).

```html
<div id="app4">
  <p m-if="{{condition}}">The Condition is True!</p>
</div>
```

```js
var app4 = new Moon({
  el: "#app4",
  data: {
    condition: true
  }
});
```

<div id="app4" class="example">
  <p m-if="{{condition}}">The Condition is True!</p>
</div>

<script>
var app4 = new Moon({
  el: "#app4",
  data: {
    condition: true
  }
});
</script>

You can also use `m-show`, and this will toggle the `display` property of the element.

Go ahead, try entering `app4.set('condition', false)` in the console!
