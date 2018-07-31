const BufferReader = require('./buffer-reader')
const BufferWriter = require('./buffer-writer')
const buttonConverter = require('./button-converter')
const hash = require('object-hash')

const REPORT_LENGTH = 7819
const ICON_SIZE = 72
const PAGE_1_PIXEL_BYTES = 2583 * 3

const PAGE_1_HEADER = Buffer.from([
  0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x42, 0x4D, 0xF6,
  0x3C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x48, 0x00, 0x00, 0x00,
  0x48, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x3C, 0x00, 0x00, 0xC4, 0x0E, 0x00,
  0x00, 0xC4, 0x0E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
])

const PAGE_2_HEADER = Buffer.from([
  0x02, 0x01, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
])

// Create these buffers once and re-use them. They're shared by all StreamDeck instances, but since JavaScript is
// single-threaded, we don't need to worry about race conditions.
const page1Buffer = new Buffer(REPORT_LENGTH, 0)
const page2Buffer = new Buffer(REPORT_LENGTH, 0)
const pixelWriter = new BufferWriter(ICON_SIZE * ICON_SIZE * 3)
PAGE_1_HEADER.copy(page1Buffer)
PAGE_2_HEADER.copy(page2Buffer)

// TODO: Make this a LRU cache.
const cache = {}

function getPageData(imageBuffer, buttonNumber, rgba) {
  let imageHash = hash(imageBuffer)
  let data = cache[imageHash]

  // No cached data exists, generate it.
  if (!data) {
    let expectedLength = ICON_SIZE * ICON_SIZE * (rgba ? 4: 3)
    if (imageBuffer.length !== expectedLength) {
      throw new Error(`image buffer must be a ${ICON_SIZE}x${ICON_SIZE} image, expected buffer length: ${expectedLength}, got: ${imageBuffer.length}`)
    }

    let reader = new BufferReader(imageBuffer)
    pixelWriter.setPosition(0)

    // Convert the image buffer from RGBA format to BGR.
    while (reader.hasData()) {
      let row = new Array(ICON_SIZE * 3)
      let i = row.length - 1

      while (i >= 0) {
        row[i--] = reader.readUInt8()
        row[i--] = reader.readUInt8()
        row[i--] = reader.readUInt8()

        if (rgba) {
          reader.increment() // Ignore the alpha channel.
        }
      }

      for (let j = 0; j < row.length; j++) {
        pixelWriter.writeUInt8(row[j])
      }
    }

    // Copy the pixel data to the buffers.
    pixelWriter.copy(page1Buffer, PAGE_1_HEADER.length, 0, PAGE_1_PIXEL_BYTES)
    pixelWriter.copy(page2Buffer, PAGE_2_HEADER.length, PAGE_1_PIXEL_BYTES, pixelWriter.length)

    data = { page1Array: Array.from(page1Buffer), page2Array: Array.from(page2Buffer) }
  }

  // Set the button that the image buffer will write to.
  let rawNumber = buttonConverter.buttonToRaw(buttonNumber)
  data.page1Array[5] = rawNumber
  data.page2Array[5] = rawNumber

  // Set the cache.
  cache[imageHash] = data
  return data
}

module.exports = { getPageData }
