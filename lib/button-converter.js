const RAW_TO_BUTTON = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1,
  6: 10,
  7: 9,
  8: 8,
  9: 7,
  10: 6,
  11: 15,
  12: 14,
  13: 13,
  14: 12,
  15: 11
}

const BUTTON_TO_RAW = {
  1: 5,
  2: 4,
  3: 3,
  4: 2,
  5: 1,
  6: 10,
  7: 9,
  8: 8,
  9: 7,
  10: 6,
  11: 15,
  12: 14,
  13: 13,
  14: 12,
  15: 11
}

/**
 * Get the raw button number from the app button number. The Stream Deck's button layout is:
 * [ 5, 4, 3, 2, 1 ]
 * [ 10, 9, 8, 7, 6 ]
 * [ 15, 14, 13, 12, 11 ]
 * This will map it to the more intuitive layout:
 * [ 1, 2, 3, 4, 5 ]
 * [ 6, 7, 8, 9, 10 ]
 * [ 11, 12, 13, 14, 15 ]
 */
function rawToButton(button) {
  return RAW_TO_BUTTON[button]
}

/**
 * Get the app button number from the raw button number.
 */
function buttonToRaw(button) {
  return BUTTON_TO_RAW[button]
}

module.exports = { rawToButton, buttonToRaw }
