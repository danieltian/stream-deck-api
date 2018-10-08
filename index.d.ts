
export function getStreamDecks(): StreamDeck[];

export function getStreamDeck(): StreamDeck | undefined;

export interface IStreamDeckListenerOptions {
    /** throttle the keypress so that the callback only fires once every x seconds */
    throttle?: boolean = true;
    /** time to wait between each callback */
    throttleTime?: number;
    /** whether to trigger the callback immediately upon the event */
    leading?: boolean = true;
    /** whether to wait until throttleTime has passed before triggering the callback */
    trailing?: boolean = false;
}

export interface IStreamDeckButtonState {
    0: undefined;
    [buttonIndex: number]: 1 | 0 | undefined;
}

export interface StreamDeck extends EventEmitter {

    /**
     * Path to the device.
     */
    readonly path: string;

    /**
     * Reset the Stream Deck. Clears all the buttons and shows the Elgato logo wallpaper.
     */
    reset(): void;

    /**
     * Set the backlight brightness of the Stream Deck.
     *
     * 7 and below will turn off the backlight, and 90 and above will be at maximum brightness.
     *
     * @param {Integer} brightness - brightness to set the backlight brightness to, between 0 and 100. 
     */
    setBrightness(brightness: number): void;

    /**
     * Remove all button listeners. Handy for doing things like implementing pages, where you want all button listeners on
     * the previous page to get removed.
     */
    removeButtonListeners(): void;

    /**
     * Draw a solid color to a button.
     * @param {Integer} hexColor - hex color of image, i.e. 0xFF0000 for red
     * @param {Integer} buttonNumber - button to fill the color with
     */
    drawColor(hexColor: number, buttonNumber: number): void;

    /**
     * Draw an image to a button given a file path.
     * @param {String} filePath - path to an image file
     * @param {Integer} buttonNumber - button to draw the image to
     * @returns {Promise} Promise for the image draw operation
     */
    drawImageFile(filePath: string, buttonNumber: number): Promise<Uint8Array>;

    /**
     * Draw an image from a buffer to a button.
     * @param {Buffer} imageBuffer - buffer containing the RGB bytes of an image
     * @param {Integer} buttonNumber - button index to draw the image to
     * @param {Boolean} rgba - whether the image buffer array is in RGBA format or RGB format
     */
    drawImageBuffer(imageBuffer: Uint8Array, buttonNumber: number, rgba: boolean = true): void;

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
    on(eventName: "down", fn: (buttonNumber: number) => any, options: IStreamDeckListenerOptions = {}): void;
    on(eventName: "up", fn: (buttonNumber: number) => any, options: IStreamDeckListenerOptions = {}): void;
    on(eventName: "state", fn: (buttonState: IStreamDeckButtonState) => any, options: IStreamDeckListenerOptions = {}): void;
    on(eventName: string, fn: Function, options: IStreamDeckListenerOptions = {}): void;

    /**
     * Return the button state, an object of all the buttons and their pressed/released state
     * @returns {Object} an object where the key is the button number and the value is an integer indicating whether the
     * button is pressed (1) or released (0)
     */
    getButtonState(): IStreamDeckButtonState;

    /** Names of events that have listeners attached. */
    eventNames(): Array<string | symbol>;

    /** The number of listeners listening to an event. */
    listenerCount(eventName: string): number;

    /** A copy of the array of listeners for the event. */
    listeners(eventName: string): Function[];

    /** Removes all listeners, or those of the optional `eventName`. */
    removeAllListeners(eventName?: string): this;

    /** Alias for `removeListener(eventName, listener)`. */
    off(eventName: string, listener: Function): this;

    /** Removes the specified listener from the named event. */
    removeListener(eventName: string, listener: Function): this;
}
