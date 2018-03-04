/* istanbul ignore next */

import ThinPromise from '../promise.es';
import assert from 'assert';
import {STATES, STATE, VALUE, DEFERS, RESOLVE, REJECT, HANDLE} from '../const'

const TEST_STRING = 'from future!'

const WONT_BE_HERE = 'won\'t be here!';

// + new Promise
describe('new Promise', () => {
  it('must has function arguments', () => {
    try {
      new ThinPromise()
    } catch (e) {
      assert.equal(e.message,  'Promise\'s parameter must be a function');
    }
  })

  it('it should be call with new', () => {
    try {
      ThinPromise(r => r)
    } catch (e) {
      assert.equal(e.message, 'Cannot call a class as a function');
    }
  })

  it('it should be normal call then new', () => {
    const p = new ThinPromise(() => {})
    assert.equal(p[STATE], STATES.PENDING)

    const c = new ThinPromise(r => r())
    assert.equal(c[STATE], STATES.FULFILLED)

    const j = new ThinPromise((r, j) => j())
    assert.equal(j[STATE], STATES.REJECTED)
  })

  it('it should only change state while pending', () => {
    const p = new ThinPromise((resolve, reject) => {
      resolve()
      reject()
    })
    assert.equal(p[STATE], STATES.FULFILLED)
    assert.equal(new ThinPromise((resolve, reject) => {
      reject()
      resolve()
    })[STATE], STATES.REJECTED)
  })

})

describe('Promise.prototype.then(onFulfilled, onRejected)', () => {
  it('it should be resolved', (done) => {
    new ThinPromise((resolve) => {
      setTimeout(() => resolve(TEST_STRING), 1000)
    }).then(s => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be reject', (done) => {
    new ThinPromise(resolve => resolve(ThinPromise.reject(TEST_STRING))).then(() => {
      console.error(WONT_BE_HERE)
    }, (s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be another reject', (done) => {
    new ThinPromise((resolve, reject) => reject(TEST_STRING)).then(() => {
      console.error(WONT_BE_HERE)
    }, (s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be resolved without onFulfilled', (done) => {

    const p = new ThinPromise(resolve => {
      setTimeout(() => resolve(TEST_STRING), 1000)
    }).then().then((s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be reject without onRejected', (done) => {
    new ThinPromise((resolve, reject) => {
      setTimeout(() => reject(TEST_STRING), 100)
    }).then().then(() => {
      console.error(WONT_BE_HERE)
    }, (s) => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should be resolved with another Promise', (done) => {
    new ThinPromise((resolve, reject) => {
      setTimeout(() => resolve(TEST_STRING), 100)
    }).then().then(s => {
      return new ThinPromise(resolve => {
        setTimeout(() => resolve(s), 100)
      })
    }).then(s => {
      assert.equal(s, TEST_STRING)
      done()
    })
  })

  it('it should reject with another ThinPromise', (done) => {
    new ThinPromise((resolve, reject) => {
      setTimeout(() => resolve(TEST_STRING), 100)
    }).then().then(s => {
      return new ThinPromise((resolve, reject) => {
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
    new ThinPromise((resolve, reject) => reject(TEST_STRING)).catch(s =>
      {
        assert.equal(s, TEST_STRING)
        done()
      })
  })

  it('should catch up reject through before', (done) => {
      new ThinPromise((r, j) => j(TEST_STRING)).then()
      .then(() => console.error(WONT_BE_HERE))
      .then()
      .catch(s => {
        assert.equal(TEST_STRING, s)
        done()
      })
  })

  it('should catch up rejection on the middle', (done) => {
    new ThinPromise((resolve, reject) => resolve(TEST_STRING))
      .then(s => {
        return new ThinPromise((resolve, reject) => {
          reject(s)
        })
      }).catch(s => {
        assert.equal(s, TEST_STRING)
        done()
      })
  })

  it('should catch up error in main context', done => {
    new ThinPromise(() => {
      throw Error(TEST_STRING)
    })
    .then()
    .catch(e => {
      assert.equal(e.message, TEST_STRING)
      done()
    })
  })

  it('can\'t catch up error in if fulfilled', done => {
    new ThinPromise((r) => {
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

    ThinPromise.resolve(TEST_STRING)
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
    new ThinPromise((resolve, reject) => {
      setTimeout(() => {
        resolve(TEST_STRING)
      }, 1000)
    }).then((s) => {
      preLog = s
      return Promise.reject(s)
    }).catch((s) => {
      assert.equal(preLog, TEST_STRING)
      assert.equal(preLog, s)
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
      ThinPromise.all(123)
    } catch (error) {
      assert.equal(error.message, 'arguments must be array')
    }
  })

  it('should reject all', (done) => {
    ThinPromise.all([
      1,
      ThinPromise.resolve(2),
      new ThinPromise((r, reject) => reject(TEST_STRING), 1000),
      ThinPromise.reject(TEST_STRING)
    ])
      .then(() => console.error(WONT_BE_HERE))
      .catch((s) => {
        assert.equal(TEST_STRING, s)
        done()
      })
  });

  it('should resolve all', (done) => {
    ThinPromise.all([
      1,
      ThinPromise.resolve(2),
      new ThinPromise((resolve, reject) => setTimeout(() => resolve(3), 1000))
    ]).then(res => {
      assert.deepEqual(res, [1, 2, 3])
      done()
    }).catch()
  });

})
