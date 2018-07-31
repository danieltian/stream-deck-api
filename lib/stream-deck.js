const EventEmitter = require('events')
const Jimp = require('jimp')
const throttleFn = require('lodash.throttle')
const pageData = require('./page-data')
const buttonConverter = require('./button-converter')

const THROTTLE_TIME = 100
const BUTTON_COUNT = 15
const ICON_SIZE = 72
const RESET_DATA = [0x0B, 0x63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const BRIGHTNESS_DATA = [0x05, 0x55, 0xAA, 0xD1, 0x01, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

class StreamDeck extends EventEmitter {
  /**
   * Create a StreamDeck instance.
   * @param {Object} device - device instance returned from new HID.HID({ ... })
   * @param {String} HID path to the device
   */
  constructor(device, path) {
    super()
    this.path = path
    this._device = device
    this._previousButtonState = new Array(15).fill(0)
    this._setupButtonListener()
    this._cache = {}
    this._buttonState = {}

    // Create a key for each button with an initial value set to 0.
    for (let i = 1; i <= BUTTON_COUNT; i++) {
      this._buttonState[i] = 0
    }
  }

  /**
   * Reset the Stream Deck. Clears all the buttons and shows the Elgato logo wallpaper.
   */
  reset() {
    this._device.sendFeatureReport(RESET_DATA)
  }

  /**
   * Set the backlight brightness of the Stream Deck.
   * @param {Integer|0-100} brightness - brightness to set the backlight brightness to, between 0 and 100. 7 and below
   * will turn off the backlight, and 90 and above will be at maximum brightness.
   */
  setBrightness(brightness) {
    BRIGHTNESS_DATA[5] = brightness
    this._device.sendFeatureReport(BRIGHTNESS_DATA)
  }

  /**
   * Remove all button listeners. Handy for doing things like implementing pages, where you want all button listeners on
   * the previous page to get removed.
   */
  removeButtonListeners() {
    this.removeAllListeners()
  }

  /**
   * Draw a solid color to a button.
   * @param {Integer} hexColor - hex color of image, i.e. 0xFF0000 for red
   * @param {Integer} buttonNumber - button to fill the color with
   */
  drawColor(hexColor, buttonNumber) {
    let colors = Jimp.intToRGBA(hexColor)
    // Because there's no alpha channel for hexColor, Jimp.intToRGBA() will offset each color by one place so that
    // [colors.g, colors.b, colors.a] are actually [R, G, B].
    let color = Buffer.from([colors.g, colors.b, colors.a])
    let buffer = Buffer.alloc(ICON_SIZE * ICON_SIZE * 3, color)
    this.drawImageBuffer(buffer, buttonNumber, false)
  }

  /**
   * Draw an image to a button given a file path.
   * @param {String} filePath - path to an image file
   * @param {Integer} buttonNumber - button to draw the image to
   * @returns {Promise} Promise for the image draw operation
   */
  drawImageFile(filePath, buttonNumber) {
    let cachedImageBuffer = this._cache[filePath]

    return new Promise((resolve, reject) => {
      if (cachedImageBuffer) {
        this.drawImageBuffer(cachedImageBuffer, buttonNumber)
        resolve(cachedImageBuffer)
      }
      else {
        Jimp.read(filePath, (error, image) => {
          if (error) {
            reject(error)
          }
          else {
            image.contain(ICON_SIZE, ICON_SIZE)
            this.drawImageBuffer(image.bitmap.data, buttonNumber)

            this._cache[filePath] = image.bitmap.data
            resolve(image.bitmap.data)
          }
        })
      }
    })
  }

  /**
   * Draw an image from a buffer to a button.
   * @param {Buffer} imageBuffer - buffer containing the RGB bytes of an image
   * @param {Integer} buttonNumber - button to draw the image to
   * @param {Boolean} rgba - whether the image buffer array is in RGBA format or RGB format
   */
  drawImageBuffer(imageBuffer, buttonNumber, rgba = true) {
    let data = pageData.getPageData(imageBuffer, buttonNumber, rgba)
    this._deviceWrite(data, buttonNumber)
  }

  /**
   * Add a listener to an event, with additional options for throttling.
   * @param {String} eventName - event name
   * @param {Function} fn - function to execute as a callback to the event
   * @param {Object} options - options for the event listener, possible keys are { throttle, throttleTime, leading, trailing }
   * @example
   * streamDeck.on('down:1', () => {
   *   console.log('button 1 pressed');
   * }, {
   *   throttle: true // throttle the keypress so that the callback only fires once every x seconds
   *   throttleTime: 100 // time to wait between each callback
   *   leading: true // whether to trigger the callback immediately upon the event
   *   trailing: false // whether to wait until throttleTime has passed before triggering the callback
   * });
   * // NOTE: throttling is provided by lodash.throttle, see this documentation for more detail on how the throttling
   * // options work: https://lodash.com/docs/4.17.4#throttle
   *
   *
   */
  on(eventName, fn, { throttle = true, throttleTime = THROTTLE_TIME, leading = true, trailing = false } = {}) {
    if (throttle) {
      super.on(eventName, throttleFn(fn, throttleTime, { leading, trailing }))
    }
    else {
      super.on(eventName, fn)
    }
  }

  /**
   * Return the button state, an object of all the buttons and their pressed/released state
   * @returns {Object} an object where the key is the button number and the value is an integer indicating whether the
   * button is pressed (1) or released (0)
   */
  getButtonState() {
    return this._buttonState
  }

  /**
   * Write the image to the Stream Deck.
   * @params {Array} pixelBuffer - buffer of raw pixel bytes in BGR format
   * @params {buttonNumber} buttonNumber - button to draw the image to
   */
  _deviceWrite({ page1Array, page2Array }) {
    this._device.write(page1Array)
    this._device.write(page2Array)
  }

  _setupButtonListener() {
    this._device.on('data', (data) => {
      // If this isn't report 1 (button states), don't do anything.
      if (data[0] != 1) {
        return
      }

      for (let i = 1; i <= BUTTON_COUNT; i++) {
        let buttonNumber = buttonConverter.rawToButton(i)
        let buttonState = data[i]
        this._buttonState[buttonNumber] = buttonState

        // If the button state changed, emit the proper events.
        if (buttonState != this._previousButtonState[i - 1]) {
          this._previousButtonState[i - 1] = buttonState

          if (buttonState) {
            this.emit(`down:${buttonNumber}`)
            this.emit('down', buttonNumber)
          }
          else {
            this.emit(`up:${buttonNumber}`)
            this.emit('up', buttonNumber)
          }
        }
      }

      this.emit('state', this._buttonState)
    })
  }
}

module.exports = StreamDeck
