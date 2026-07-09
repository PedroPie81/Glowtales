// Exports the platform's native DOMException, which is globally available since Node.js 18+
module.exports = globalThis.DOMException || class DOMException extends Error {
  constructor(message, name) {
    super(message);
    this.name = name || 'DOMException';
  }
};
