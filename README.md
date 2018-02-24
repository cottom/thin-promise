# Promise polyfill
[![Build Status](https://travis-ci.org/jerry-i/thin-promise.svg?branch=master)](https://travis-ci.org/jerry-i/thin-promise)[![Coverage Status](https://coveralls.io/repos/github/jerry-i/thin-promise/badge.svg?branch=master)](https://coveralls.io/github/jerry-i/thin-promise?branch=master)


## API

+ new Promise
+ Promise.prototype.then(onFulfilled?, onRejected?)
+ Promise.prototype.catch(errorhandler)
+ Promise.prototype.finally(finallyFun)
+ Promise.all(Array)
+ Promise.resolve
+ Promise.reject

## import

```js
import Promise from 'thin-promise'

```
or

```html
<script src="https://unpkg.com/thin-promise"></script>
window.Promise = ThinPromise
```

## Example

just see [test](https://github.com/jerry-i/thin-promise/blob/master/test/promise.spec.js)
