import {STATES, STATE, VALUE, DEFERS, RESOLVE, REJECT, HANDLE} from './const'

const isThenable = obj => typeof obj === 'object' && typeof obj.then === 'function'
const asyncFn = (() => {
  /* istanbul ignore next */
  if (process && typeof process === 'object' && typeof process.nextTick === 'function') return process.nextTick
  else if (typeof setImmediate === 'function') return setImmediate
  /* istanbul ignore next */
  return setTimeout
})()

class Promise {
  constructor(fn) {
    if (typeof fn !== 'function') throw Error(`Promise's parameter must be a function`)
    // 初始化Promise状态、执行结果、callback数组
    this[STATE] = STATES.PENDING
    this[VALUE] = null
    this[DEFERS] = []
    // 立即执行 fn
    try {
      fn(this[RESOLVE].bind(this), this[REJECT].bind(this))
    } catch (error) {
      if (this[STATE] === STATES.PENDING) this[REJECT].call(this, error)
    }
  }
  // static function
  static resolve(value) {
    return new Promise(resolve => resolve(value))
  }
  static reject(value) {
    return new Promise((resolve, reject) => reject(value))
  }
  static all(array) {
    if (!Array.isArray(array)) throw Error('arguments must be array')
    const allCount = array.length
    let resolvedCount = 0
    let resolvedResult = []
    return new Promise((resolve, reject) => {
      array.map(item => isThenable(item) ? item : Promise.resolve(item)).forEach((item, index) => {
        item.then(value => {
          resolvedResult[index] = value
          if (++resolvedCount === allCount) resolve(resolvedResult)
        }, reject)
      })
    })
  }
  // public function
  then(onResolved, onRejected) {
    return new Promise((resolve, reject) => {
      this[HANDLE]({
        onResolved,
        onRejected,
        resolve,
        reject
      })
    });
  }
  finally(onFinal) {
    return new Promise((resolve, reject) => {
      this[HANDLE]({
        onFinal,
        resolve,
        reject
      })
    })
  }
  catch(onRejected) {
    return new Promise((resolve, reject) => {
      this[HANDLE]({
        onRejected,
        resolve,
        reject
      })
    })
  }
  // private function
  [RESOLVE](value) {
    if (this[STATE] !== STATES.PENDING) return
    if (isThenable(value)) {
      return value.then.call(value, this[RESOLVE].bind(this), this[REJECT].bind(this))
    }
    this[VALUE] = value
    this[STATE] = STATES.FULFILLED
    this[DEFERS].forEach(defer => this[HANDLE](defer))
  }
  [REJECT](value) {
    if (this[STATE] !== STATES.PENDING) return
    this[VALUE] = value
    this[STATE] = STATES.REJECTED
    this[DEFERS].forEach(defer => this[HANDLE](defer))
  }
  [HANDLE]({ onResolved, onRejected, resolve, reject, onFinal }) {
    if (this[STATE] === STATES.PENDING) {
      this[DEFERS].push({ onResolved, onRejected, resolve, reject, onFinal })
      return;
    }

    const callback = this[STATE] === STATES.FULFILLED ? onResolved : onRejected
    const next = this[STATE] === STATES.FULFILLED ? resolve : reject
    asyncFn(() => {
      try {
        if (!callback) {
          // do not change state when no callback
          next(this[VALUE])
          onFinal && onFinal()
        } else {
          // change state to fulfilled when callback exist
          resolve(callback(this[VALUE]))
        }
      } catch (error) {
        reject(error)
      }
    })
  }
}
export default Promise;
