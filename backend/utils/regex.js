'use strict';

const SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/** Escapes user input so it can be embedded safely inside a RegExp. */
const escapeRegex = (value) => String(value).replace(SPECIAL_CHARS, '\\$&');

module.exports = { escapeRegex };
