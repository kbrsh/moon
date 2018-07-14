---
title: About
order: 1
---

Moon is a JavaScript library with a minimal API and fast view compiler. It splits up a web application into two parts: the view and the data. The view is responsible for displaying the data to the user. Moon compiles the view into a vanilla JavaScript program capable of creating, updating, and destroying the view. The data is a simple object with access to the Moon API for updating itself.

```html
<p If={condition}>{foo}</p>
<p Else>{bar}</p>
```

```js
function view(m, instance) {
  var m0, m1, m2, m3, m4, m5;
  return [
    function(_0) {
      m0 = _0;
      m3 = m.cc();
      m.ac(m3, m0);
      m5 = [
        (function(locals) {
          var m6, m7, m8;
          return [
            function(_0) {
              m6 = _0;
              m7 = m.ce("p");
              m8 = m.ctn("");
              m.ac(m8, m7);
              m.ib(m7, m3, m6);
            },
            function() {
              m.stc(m8, instance.foo);
            },
            function() {
              m.rc(m7, m6);
            }
          ];
        })({}),
        (function(locals) {
          var m6, m7, m8;
          return [
            function(_0) {
              m6 = _0;
              m7 = m.ce("p");
              m8 = m.ctn("");
              m.ac(m8, m7);
              m.ib(m7, m3, m6);
            },
            function() {
              m.stc(m8, instance.bar);
            },
            function() {
              m.rc(m7, m6);
            }
          ];
        })({})
      ];
    },
    function() {
      m4 = [instance.condition, true];
      m2 = m.di(m2, m4, m5, m0);
    },
    function() {
      m2[2]();
    }
  ];
}
```
