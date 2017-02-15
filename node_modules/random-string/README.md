# random-string

Simple Module for generating Random Strings

![random-string](https://api.travis-ci.org/valiton/node-random-string.png "random-string")

## Getting Started
Install the module with: `npm install random-string`

```javascript
var randomString = require('random-string');
var x = randomString(); // x contains now a random String with the length of 8
```

## Documentation

You can call the randomString-Method with additional options for specifing how long your resulting string should be and which characters to include

```javascript
// e.g. you want a string with a length of 20
var x = randomString({length: 20});
```

### options

#### options.length

number - the length of your resulting string (DEFAULT: 8)

#### options.numeric

boolean - should your resulting string contain numbers (from 0-9) (DEFAULT: true)

#### options.letters

boolean - should your resulting string contain letters (from a-z, lower and uppercase) (DEFAULT: true)

#### options.special

boolean - should your resulting string contain any of these special characters (!$%^&*()_+|~-=`{}[]:;<>?,./) (DEFAULT: false)


## Examples

```javascript
// that would be a call with all options (hint: thats a call with all defaults, und the options wouldnt be necessary in that case!)
var x = randomString({
  length: 8,
  numeric: true,
  letters: true,
  special: false
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## Release History

- 0.1.2 fix characterset ([#2](https://github.com/valiton/node-random-string/issues/2))

- 0.1.1 do not contain special cars per default

- 0.1.0 Initial Release


## Contributors

- Bastian "hereandnow" Behrens


## License
Copyright (c) 2013 Valiton GmbH
Licensed under the MIT license.
