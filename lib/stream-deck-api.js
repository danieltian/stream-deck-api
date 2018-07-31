const HID = require('node-hid')
const StreamDeck = require('./stream-deck')

const VENDOR_ID = 4057
const PRODUCT_ID = 96

class StreamDeckApi {
  constructor() {
    this._streamDecks = []
  }

  getStreamDecks() {
    let devices = HID.devices().filter((device) => device.vendorId == VENDOR_ID && device.productId == PRODUCT_ID)

    devices.forEach((device) => {
      // If the device hasn't already been added to the list, create a new device for it.
      if (!this._streamDecks.some((streamDeck) => device.path == streamDeck.path)) {
        let hidDevice = new HID.HID(device.path)
        let newDeck = new StreamDeck(hidDevice, device.path)

        this._streamDecks.push(newDeck)
      }
    })

    return this._streamDecks
  }

  getStreamDeck() {
    return this.getStreamDecks()[0]
  }
}

module.exports = new StreamDeckApi()
