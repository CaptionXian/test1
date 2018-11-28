class APIError {
  constructor (status, name, message) {
    this.status = status
    this.name = name
    this.message = message
  }
}

class APIErrorPool {
  constructor () {
    this._errormap = new Map()
  }

  hasError (name) {
    return this._errormap.has(name)
  }

  register (status, name, message) {
    const definedError = new Error(
      `APIError [${status}.${name}] already defined`
    )
    if (this.hasError(name)) {
      throw definedError
    }

    const err = new APIError(status, name, message)
    this._errormap.set(name, err)
  }

  get (name) {
    return this._errormap.get(name)
  }
}

module.exports = new APIErrorPool()
