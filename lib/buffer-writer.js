class BufferWriter {
  constructor(length = 0) {
    this._buffer = Buffer.alloc(length, 0)
    this._position = 0
  }

  writeUInt8(number) {
    this._buffer.writeUInt8(number, this._position)
    this._position = this._position + 1
  }

  slice(start, end) {
    return this._buffer.slice(start, end)
  }

  copy(target, targetStart, sourceStart, sourceEnd) {
    return this._buffer.copy(target, targetStart, sourceStart, sourceEnd)
  }

  setPosition(position) {
    this._position = position
  }

  get buffer() {
    return this._buffer
  }

  get length() {
    return this._buffer.length
  }
}

module.exports = BufferWriter
