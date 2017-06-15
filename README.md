# Stream Deck API
Stream Deck API is a library that allows you to interact with an Elgato Stream Deck controller.

## Examples

### Detect Button Press

```js
const streamDeckDeckApi = require('stream-deck-api');
var streamDeck = streamDeckApi.getStreamDeck();

// -----------------------------------
// Individual button presses by number
// -----------------------------------
streamDeck.on('down:1', () => { console.log('button 1 pressed'); });
streamDeck.on('up:1', () => { console.log('button 1 released'); });

// -------------------------------------------------------------
// Individual button presses, button number as callback argument
// -------------------------------------------------------------
streamDeck.on('down', (buttonNumber) => {
  if (buttonNumber == 1) { console.log('button 1 pressed'); }
  else if (buttonNumber == 2) { console.log('button 2 pressed'); }
});

streamDeck.on('up', (buttonNumber) => {
  if (buttonNumber == 1) { console.log('button 1 released'); }
  else if (buttonNumber == 2) { console.log('button 2 released'); }
});

// -----------------------------------------------------
// Button state changed, callback with all button states
// -----------------------------------------------------
streamDeck.on('state', (buttonState) => {
  // buttonState is the object { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, ... }
  // where the key is the button number and the value is whether the button is pressed or released
  if (buttonState.8 == 1) { console.log('button 8 pressed'); }
  else if (!buttonState.8 == 0) { console.log('button 8 released'); }
});

// ----------------------------------------
// Synchronous function to get button state
// ----------------------------------------
var buttonState = streamDeck.getButtonState();
if (buttonState.8 == 1) { console.log('button 8 pressed') };
if (buttonState.8 == 0) { console.log('button 8 released') };
```

### Draw Image or Color to Button

```js
const streamDeckDeckApi = require('stream-deck-api');
var streamDeck = streamDeckApi.getStreamDeck();
var buttonNumber = 2;

// -------------------------
// Draw image from file path
// -------------------------
streamDeck.drawImageFile('path/to/file/image.png', buttonNumber);

// --------------------------
// Draw image from raw buffer
// --------------------------
var buffer = someImageLibraryopen('path/to/file/image.png').getRawBuffer();
var isRGBA = true; // buffer is in RGBA format where each pixel uses 4 bytes in the buffer
streamDeck.drawImageBuffer(buffer, buttonNumber, isRGBA);

// ----------------------------------------------
// Draw pure color, colors provided as hex values
// ----------------------------------------------
streamDeck.drawColor(0x000000, buttonNumber); // black
streamDeck.drawColor(0xFF0000, buttonNumber); // red
streamDeck.drawColor(0x00FF00, buttonNumber); // green
streamDeck.drawColor(0x0000FF, buttonNumber); // blue
streamDeck.drawColor(0xFFFFFF, buttonNumber); // white
```

## API
##### TODO: Write API docs

## Caching
##### TODO: Clean this up
Quick and dirty explanation: Because it takes a non-trivial amount of time to process an image (reading it from disk and resizing it) and to create the data that gets sent to the Stream Deck, caching has been implemented in order to speed up this process.

You won't see the caching/non-caching effects if you draw to only one button; it's too quick to notice. However, if you draw to all 15 buttons at once, you'll notice that without caching (for example, the first time you draw to all the buttons), there will be a ripple effect as the buttons draw one after another. With caching enabled (currently forced and no way to disable), they will be drawn instantly.

Caching is currently enabled in two places:

1. By image path. If you call `streamDeck.drawImageFile()`, the image will be opened, resized, and the raw buffer data cached. Subsequent calls to `streamDeck.drawImageFile()` with the same path will load the cached data instead. This means that if you alter the image without restarting the app, it won't have any effect because the cached data is used, not the disk copy. The ability to disable this cache selectively or globally will be added in the future.


2. By image buffer contents. Before the image is sent to the Stream Deck, it must be split into two byte arrays. The byte arrays are cached once constructed, with the cache key being the image buffer hash. This means that the same image buffer will create the same byte arrays, and so the byte arrays are cached. The ability to disable this cache selectively or globally will be added in the future, which can be useful if you're dynamically generating a lot of image buffers (for example, displaying dynamic text in a button).
