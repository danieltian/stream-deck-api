class BufferReader {
  constructor(buffer) {
    this._buffer = buffer;
    this._position = 0;
  }

  readUInt8() {
    let byte = this._buffer.readUInt8(this._position);
    this.increment();
    return byte;
  }

  increment() {
    this._position = this._position + 1;
  }

  hasData() {
    return this._position < this._buffer.length;
  }
}

module.exports = BufferReader;
