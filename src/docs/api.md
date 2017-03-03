---
title: API
---

This is a complete guide to Moon's API, including all instance methods and global methods.

#### Configuration

Moon comes with a global `Moon.config` object that can be used to set any custom settings provided.

##### **silent**

- Type: `boolean`
- Default: `false`

Usage:
```js
Moon.config.silent = true;
```

Can toggle all logs (excluding errors)
