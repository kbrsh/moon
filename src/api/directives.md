---
title: Directives
---

Moon comes with directives similar to Angular, allowing you to dynamically render elements. A directive is indicated with the `m-` prefix and the name of the directive.

##### **text**

- Expects: `String`

Usage:
```html
<h1 m-text="{{msg}}"></h1>
```

Can be used to dynamically set the `textContent` of an element.

##### **html**

- Expects: `String`

Usage:
```html
<h1 m-html="{{html}}"></h1>
```

Can be used to dynamically set the `innerHTML` of an element.

##### **if**

- Expects: `Boolean`

Usage:
```html
<h1 m-if="{{condition}}"></h1>
<h1 m-if="true === false"></h1>
```

Can be used to conditionally render an element based on a case, it can take any valid Javascript expression.

##### **show**

- Expects: `Boolean`

Usage:
```html
<h1 m-show="{{condition}}"></h1>
<h1 m-show="true === false"></h1>
```

Similar to `if`, but it toggles the `display` property of an element. It can take any valid Javascript expression.

##### **for**

- Expects: `Array`

Usage:
```html
<ul>
  <li m-for="item in {{items}}">{{item}}</li>
</ul>
```

Can be used to render an array, the alias (the part before `in`) can be used in `{{mustache}}` templates within the element.

##### **on**

- Expects: `String`
- Modifiers:
  - `stop`: Will call `event.stopPropagation()`
  - `prevent`: Will call `event.preventDefault()`
  - `ctrl`: Will only fire if the control key is being clicked
  - `shift`: Will only fire if the shift key is being clicked
  - `alt`: Will only fire if the alt key is being clicked
  - `enter`: Will fire when the enter key is clicked

Usage:
```html
<button m-on="click:someMethod"></button>
<button m-on="click:someMethod('foo', 'bar')"></button>
<button m-on="click.shift:someMethod('foo', 'bar')"></button>
```

Can be used to attach an event listener to an element correctly, and firing a method when invoked.

##### **model**

- Expects: `String`

Usage:
```html
<input m-model="msg">
```

Can be used for two way databinding, the value of any input with this directive will be bound to the data property provided, and any changes to the data property will be reflected in the input value.

##### **literal**

- Expects: `Expression`

Usage:
```html
<h1 m-literal="id: 1 + 1"></h1>
```

Syntax for setting `class` can be an array, object, or string.

```html
<h1 m-literal="class: ['className', 'otherClass']"></h1>
<h1 m-literal="class: {className: {{otherCondition}}, otherClass: false}"></h1>
```

Note how the object syntax needs a special case, if this is true, then the class will be applied.

Can be used to treat the value of a property as a literal Javascript expression.

##### **once**

Usage:
```html
<h1 m-once>{{msg}}</h1>
```

Used to update an element only once.

##### **pre**

Usage:
```html
<h1 m-pre>{{msg}}</h1>
```

Used to not render an element's mustache templates.
