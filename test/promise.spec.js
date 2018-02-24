/* istanbul ignore next */

const Promise = require('../dist/thin-promise.cjs.js')
const assert = require('assert');
const TEST_STRING = 'from future!'

const WONT_BE_HERE = 'won\'t be here!';

// + new Promise
describe('new Promise', () => {
  it('must has function arguments', () => {
    try {
      new Promise()
    } catch (e) {
      assert.equal(e.message,  'undefined is not a function!');
    }
  })

  it('it should be call with new', () => {
    try {
      Promise(r => r)
    } catch (e) {
      assert.equal(e.message, 'Promise must be called with new!');
    }
  })

  it('it should be normal call then new', () => {
    const p = new Promise(() => {})
    assert.equal(p.state, 'pending')

    const c = new Promise(r => r())
    assert.equal(c.state, 'fulfilled')

    const j = new Promise((r, j) => j())
    assert.equal(j.state, 'rejected')
  })

  it('it should only change state while pending', () => {
    const p = new Promise((resolve, reject) => {
      resolve()
      reject()
    })
    assert.equal(p.state, 'fulfilled')
    assert.equal(new Promise((resolve, reject) => {
      reject()
      resolve()
    }).state, 'rejected')
  })

})

describe('Promise.prototype.then(onFulfilled, onRejected)', () => {
  it('it should be resolved', (done) => {
    new Promise((resolve) => {
      setTimeout(() => resolve(TEST_STRING), 1000)
    }).then(s => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be reject', (done) => {
    new Promise(resolve => resolve(Promise.reject(TEST_STRING))).then(() => {
      console.error(WONT_BE_HERE)
    }, (s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be another reject', (done) => {
    new Promise((resolve, reject) => reject(TEST_STRING)).then(() => {
      console.error(WONT_BE_HERE)
    }, (s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be resolved without onFulfilled', (done) => {

    const p = new Promise(resolve => {
      setTimeout(() => resolve(TEST_STRING), 1000)
    }).then().then((s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be reject without onRejected', (done) => {
    new Promise((resolve, reject) => {
      setTimeout(() => reject(TEST_STRING), 100)
    }).then().then(() => {
      console.error(WONT_BE_HERE)
    }, (s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be resolved with another Promise', (done) => {
    new Promise((resolve, reject) => {
      setTimeout(() => resolve(TEST_STRING), 100)
    }).then().then(s => {
      return new Promise(resolve => {
        setTimeout(() => resolve(s), 100)
      })
    }).then(s => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should reject with another Promise', (done) => {
    new Promise((resolve, reject) => {
      setTimeout(() => resolve(TEST_STRING), 100)
    }).then().then(s => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(s), 100)
      })
    }).then(
      () => console.error(),
      s => {
        assert.equal(s, TEST_STRING)
        done()
      }
    )
  })
})

describe('Promise.prototype.catch(errorhandler)', (done) => {

  it('should catch up reject', (done) => {
    new Promise((resolve, reject) => reject(TEST_STRING)).catch(s =>
      {
        assert.equal(s, TEST_STRING)
        done()
      })
  })

  it('should catch up reject through before', (done) => {
      new Promise((r, j) => j(TEST_STRING)).then()
      .then(() => console.error(WONT_BE_HERE))
      .then()
      .catch(s => {
        assert.equal(TEST_STRING, s)
        done()
      })
  })

  it('should catch up rejection on the middle', (done) => {
    new Promise((resolve, reject) => resolve(TEST_STRING))
      .then(s => {
        return new Promise((resolve, reject) => {
          reject(s)
        })
      }).catch(s => {
        assert.equal(s, TEST_STRING)
        done()
      })
  })

  it('should catch up error in main context', done => {
    new Promise(() => {
      throw Error(TEST_STRING)
    })
    .then()
    .catch(e => {
      assert.equal(e.message, TEST_STRING)
      done()
    })
  })

  it('can\'t catch up error in if fulfilled', done => {
    new Promise((r) => {
      r(TEST_STRING)
      throw Error(TEST_STRING)
    })
    .then()
    .catch(e => {
      assert.equal(true, false)
      done()
    }).then(s => {
      assert.equal(TEST_STRING, s)
      done()
    })
  })

  it('should catch up error in onFulfilled', done => {

    Promise.resolve(TEST_STRING)
    .then((s) => {
      throw Error(s)
    })
    .catch(e => {
      assert.equal(e.message, TEST_STRING)
      done()
    })
  })

})

describe('Promise.prototype.finally(finallyFun)', () => {
  const IN_FINALLY = 'in finally'
  const IN_CATCH = 'in catch'
  const AFTER_FINALLY = 'after finally'
  let preLog = null
  it('should log in order', () => {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(TEST_STRING)
      }, 1000)
    }).then((s) => {
      preLog = s
    }).catch(() => {
      assert.equal(preLog, TEST_STRING)
      preLog = IN_CATCH
    }).finally(() => {
      assert.equal(preLog, IN_CATCH)
      preLog = IN_FINALLY
    }).then(() => {
      assert.equal(preLog, IN_FINALLY)
      done()
    })
  })
})

describe('Promise.all', () => {
  it('should use Array as arguments', () => {
    try {
      Promise.all(123)
    } catch (error) {
      assert.equal(error.message, 'arguments must be array')
    }
  })

  it('should resolve all', (done) => {
    Promise.all([1, Promise.resolve(2), new Promise((resolve, reject) => setTimeout(() => resolve(3), 1000))]).then(res => {
      console.log(res)
      assert.deepEqual(res, [1, 2, 3])
      done()
    })
  })

  it('should reject', (done) => {
    Promise.all([1, Promise.resolve(2), new Promise((r, reject) => reject(TEST_STRING), 1000), Promise.reject(TEST_STRING)])
      .then(() => console.error(WONT_BE_HERE))
      .catch((s) => {
        assert.equal(TEST_STRING, s)
        done()
      })
  })

})
