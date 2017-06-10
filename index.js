const streamDeckApi = require('./stream-deck-api');

let streamDeck = streamDeckApi.getStreamDeck();
streamDeck.reset();

streamDeck.drawImageFile('./images/nyancat.png', 1);

streamDeck.on('down', (buttonNumber) => {
  streamDeck.drawImageFile('./images/nyancat.png', buttonNumber);
});

streamDeck.on('up', (buttonNumber) => {
  streamDeck.drawColor(0x000000, buttonNumber);
});

process.on('SIGINT', () => {
  streamDeck.reset();
  process.exit();
});
