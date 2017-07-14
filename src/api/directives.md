---
title: Directives
---

Moon comes with directives similar to Angular, allowing you to dynamically render elements. A directive is indicated with the `m-` prefix and the name of the directive. A directive is compiled as if it were an **expression**, in which all data properties are available as if it were plain Javascript. This means that there are no templates.

##### **html**

- Expects: `String`

Usage:
```html
<h1 m-html="html"></h1>
```

Can be used to dynamically set the `innerHTML` of an element. Note that this will not be compiled (you cannot use directives or templates)

##### **if**

- Expects: `Boolean`

Usage:
```html
<h1 m-if="condition"></h1>
<h1 m-if="true === false"></h1>
```

Can be used to conditionally render an element based on a case, it can take any valid Javascript expression.

##### **show**

- Expects: `Boolean`

Usage:
```html
<h1 m-show="condition"></h1>
<h1 m-show="true === false"></h1>
```

Similar to `if`, but it toggles the `display` property of an element. It can take any valid Javascript expression.

##### **for**

- Expects: `Array|Object|Number`

Usage:
```html
<ul>
  <li m-for="item in array">{{item}}</li>
  <li m-for="item,index in array">{{item}}</li>

  <li m-for="item in object">{{item}}</li>
  <li m-for="item,key in object">{{item}}</li>

  <li m-for="i in 10">{{item}}</li>
  <li m-for="i,index in 10">{{item}}</li>
</ul>
```

Can be used to render an array, object, or number (a range), the alias (the part before `in`) can be used in `{{mustache}}` templates within the element.

##### **on**

- Expects: `String`
- Arguments: `{String} event`
- Modifiers:
  - `stop`: Will call `event.stopPropagation()`
  - `prevent`: Will call `event.preventDefault()`
  - `ctrl`: Will only fire if the control key is being clicked
  - `shift`: Will only fire if the shift key is being clicked
  - `alt`: Will only fire if the alt key is being clicked
  - `enter`: Will fire when the enter key is clicked

Usage:
```html
<button m-on:click="someMethod"></button>
<button m-on:click="someMethod(msg, 'foo', 'bar')"></button>
<button m-on:click.shift="someMethod(msg, 'foo', 'bar')"></button>
<component m-on:customEvent="parentHandler"></component>
```

Can be used to attach an event listener to an element correctly, and firing a method when invoked. All data is available within the parameters (including methods), and can be accessed with plain Javascript.

Can also attach an event listener to listen any child component events. The event fired on the child will result in the parent handler being called. Note that this only works if the handler is set on the root child component.

##### **model**

- Expects: `String`

Usage:
```html
<input type="text" m-model="msg">
<input type="checkbox" name="value" value="Item" m-model="selectedItems[0]">
<input type="radio" name="value" value="Item" m-model="selectedItem">
```

Can be used for two way data binding, the value of any input with this directive will be bound to the data property provided, and any changes to the data property will be reflected in the input value.

When used on a checkbox, the resulting value will be the current state of the checkbox.

When used on a radio button, the resulting value will be the `value` attribute of the current selected item.

##### **literal**

- Expects: `Expression`
- Arguments: `{String} attr`

Usage:
```html
<h1 m-literal:id="1 + 1"></h1>
<h1 m-literal:id="count + 2"></h1>
<h1 m-literal:id="dynamicID"></h1>
```

Syntax for setting `class` can be an array, object, or string.

```html
<h1 m-literal:class="['className', 'otherClass']"></h1>
<h1 m-literal:class="{className: condition, otherClass: false}"></h1>
```

Note how the object syntax needs a special case, if this is true, then the class will be applied.

Can be used to treat the value of a property as a literal Javascript expression.

##### **mask**

Usage:
```html
<h1 m-mask>{{msg}}</h1>
```

Does nothing at all, but since it will be removed at runtime, it can be used to mask elements while Moon renders them for the first time. For example, you can do:

```css
[m-mask] {
  display: none;
}
```
