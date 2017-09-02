---
title: Overview
---

Moon is a minimal, blazing fast library for building user interfaces. It combines the positive aspects of popular libraries into one small package. It's super lightweight, and includes advanced optimizations to ensure fast render times. The API is small and intuitive, while still remaining powerful. Moon is compatible with IE9+.

For example, here is the minified + gzipped size for popular libraries compared to Moon (less is better):

- Preact - 3kb
- Moon - 7kb
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

#### Another library?

Yes, there have been a **lot** of front end libraries released lately, and many people prefer different parts about each of these libraries. For example, React provides the ability to use JSX and uses a virtual DOM, Angular provides easy to use directives, and Ember provides a nice templating engine built in.

Moon aims to combine the best parts of these libraries into a single, lightweight package, while providing improved performance.

#### Reactive Data

With Moon, all of your data is kept in sync with the DOM, while in JQuery, this was a tedious task that had to be done manually.

Moon, on the other hand, has a lightweight templating engine built in, it lets you interpolate data with a simple `{{mustache}}` template. You can uses these templates anywhere in your app, including attributes!

Take a look at this example:

```html
<div id="app1">
  <p style="color: {{color}}">Change my Color!</p>
</div>
```

```js
const app1 = new Moon({
  el: "#app1",
  data: {
    color: "blue"
  }
});
```

<div id="app1" class="example">
  <p style="color: {{color}}">Change my Color!</p>
</div>

<script>
var app1 = new Moon({
  el: "#app1",
  data: {
    color: "blue"
  }
});
</script>

As you can see, the paragraph renders with a blue color!
Go ahead, try changing it in the console with `app1.set('color', 'green')`

Internally, each instance has an **observer**. Every time you `.set` a property, the observer is notified of a change, and it will queue a build.

#### Async Queue

You'll notice how the observer _queues_ a build. This is to optimize performance by building as less as possible. For example:

```js
app.set('count', 1);
app.set('count', 2);
app.set('count', 3);
```

If you created an app with a `count` property in the data, and ran this code, Moon would only update once. Why? Moon pushes this build to a queue, and if it is not building already, then it will run a build. If not, it will wait until all the data in the current block is set, then build.

If you'd like to see the DOM after an update is queued, you can use `Moon.nextTick` like:

```js
Moon.nextTick(function() {
  // DOM is updated
});
```

#### Directives

Angular provided a lot of helpful directives that could perform a variety of tasks. Moon has directives as well, and can be used to conditionally render items, to render lists, to attach event listeners, to do two way data binding, and to give hints to the compiler. Directives always have a prefix of `m-`.

Let's look at a practical example: What if you need to display a "Profile" link if a user is signed in? How would you update if the user signed out?

```html
<div id="app2">
  <p m-if="signedIn">Profile</p>
</div>
```

```js
const app2 = new Moon({
  el: "#app2",
  data: {
    signedIn: true
  }
});
```
<div id="app2" class="example">
  <p m-if="signedIn">Profile</p>
</div>

<script>
var app2 = new Moon({
  el: "#app2",
  data: {
    signedIn: true
  }
});
</script>

Now, if you detected the user has signed out, the app will update, try it yourself!

Type `app2.set('signedIn', false)` in the console, and watch the DOM being updated!

#### Components

Components are super useful, allowing you to reuse certain elements of your app. Moon has a component system like React/Vue, allowing you to compose entire applications with components.

Each component is a mini Moon instance, that the diff engine treats differently.

Like React, Moon also offers stateless functional components with just a render function. These provide a performance boost when diffing.

Regular components are optimized by default, you have to do no work. It's like the `shouldComponentUpdate()` hook in React is already implemented for you by Moon's smart rendering engine.

If you have multiple components, but only update one, only that component will be updated.

Moon's components also have a **slot** system, allowing you to render the HTML that was inside the component being rendered.

Here is how an app that uses components might look like:

```html
<App>
  <Header>Some Content</Header>
  <Content>Body Content</Content>
  <List items="{{items}}"/>
</App>
```
