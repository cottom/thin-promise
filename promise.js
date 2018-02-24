/**
 * prefix with `_method` or `_value` would be private method or value of Promise
 */
const states = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
}
const isThenable = o => typeof o === 'object' && typeof o.then === 'function'

function Promise(fn) {
  if (!(this instanceof Promise)) throw Error('Promise must be called with new!')
  if (!fn) throw Error(`${fn} is not a function!`)
  this.state = states.PENDING
  this.value = null
  this._defers = []
  try {
    fn(this._resolve.bind(this), this._reject.bind(this))
  } catch(e) {
    if (this.state === states.PENDING) this._reject.call(this, e)
  }
}

Promise.resolve = function(value) {
  return new Promise(resolve => resolve(value))
}

Promise.reject = function(value) {
  return new Promise((resolve, reject) => reject(value))
}

Promise.all = function (array) {
  if (!Array.isArray(array)) {
    throw Error('arguments must be array')
  }
  const allReadyCount = array.length
  let readyCount = 0
  const result = []
  let rejected = false
  return new Promise((resolve, reject) => {
    const shouldResolve = () => !rejected && (++readyCount === allReadyCount) && resolve(result)
    array.forEach((item, index) => {
      if (isThenable(item)) {
        item.then(val => {
          result[index] = val
          shouldResolve()
        }).catch(e => {
          if (rejected) return
          rejected = true
          reject(e)
        })
      } else {
        result[index] = item
        shouldResolve()
      }
    })
  })
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  return new Promise((resolve, reject) => {
    this._handle({
      onFulfilled,
      onRejected,
      resolve,
      reject
    })
  })
}

Promise.prototype.finally = function (onFinal) {
  return new Promise((resolve, reject) => {
    this._handle({
      resolve,
      reject,
      onFinal: onFinal
    })
  })
}

Promise.prototype.catch = function (errorReject) {
  return new Promise((resolve, reject) => {
    this._handle({
      resolve,
      reject,
      onRejected: errorReject
    })
  })
}

Promise.prototype._resolve = function (val) {
  // handle with promise
  if (isThenable(val)) {
    val.then.call(val, this._resolve.bind(this), this._reject.bind(this))
    return
  }
  if (this.state !== states.PENDING) return
  this.state = states.FULFILLED
  this.value = val
  this._run()
}

Promise.prototype._reject = function (val) {
  if (this.state !== states.PENDING) return
  this.state = states.REJECTED
  this.value = val
  // console.log('call reject')
  this._run()
}

Promise.prototype._handle = function (defer) {
  if (this.state === states.PENDING) {
    this._defers.push(defer)
  } else {
    const { onFulfilled, onRejected, resolve, reject, onFinal } = defer
    const isFulfilled = this.state === states.FULFILLED
    const callback = isFulfilled ? onFulfilled : onRejected
    if (!callback) {
      // first new
      onFinal && onFinal();
      (isFulfilled ? resolve : reject)(this.value)
      return
    }
    try {
      resolve(callback(this.value))
    } catch(e) {
      reject(e)
    }
  }
}

Promise.prototype._run = function () {
  // in the real word, would use micro task not task
  setTimeout(() => {
    this._defers.forEach((defer) => this._handle(defer))
  })
}

export default Promise
