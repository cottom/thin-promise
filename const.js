export const STATES = {
  PENDING: Symbol('pending'),
  FULFILLED: Symbol('fulfilled'),
  REJECTED: Symbol('rejected')
}

export const STATE = Symbol('state')
export const VALUE = Symbol('value')
export const DEFERS = Symbol('defers')

export const RESOLVE = Symbol('resolve')
export const REJECT = Symbol('reject')
export const HANDLE = Symbol('handle')
