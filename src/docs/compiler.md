---
title: Compiler
---

Moon has a custom HTML compiler built in to generate render functions. This means that before Moon can mount, the template must go through Moon's HTML compiler to be turned into plain javascript.

#### Render

Render functions are called in each update, and it gives Moon a new version of the lightweight virtual DOM. These render functions can be defined in a `render` option (for advanced users). They use a "HyperMoon" syntax which should provide custom meta data for the virtual DOM engine.

For example:

```js
new Moon({
  render: function(m) {
    return m('h1', {attrs: {}}, {shouldRender: false}, [m("#text", {shouldRender: false}, "Hello Moon!")]);
    // same as <h1>Hello Moon!</h1>
  }
});
```

#### Precompiling

You should always precompile your templates into render functions and provide them as this option when pushing into production, so Moon can skip compiling your HTML during runtime.

To directly compile HTML, use the global `Moon.compile` function.

```js
Moon.compile("<p>Some HTML</p>");
```

You can also play around with the compiler below:

<div id="compiler" class="example"><textarea m-on:input="compile"></textarea><pre><code data-nohighlight="true" m-literal:style="'color: ' + (err ? 'red' : '')">{{compiled}}</code></pre></div>

<script>
new Moon({
  el: "#compiler",
  data: {
    compiled: function() {},
    err: false,
  },
  methods: {
    compile: function(event) {
      var app = this;
      this.set('err', false);
      console.error = function(msg) {
        app.set('compiled', msg)
        app.set('err', 'true');
      }
      var textareaVal = event.target.value;
      if(textareaVal) {
        var val = Moon.compile(textareaVal);
        if(!this.get('err')) {
          this.set('compiled', val);
          this.set('err', false);
        }
      }
    }
  }
});
</script>
