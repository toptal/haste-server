module.exports = class KeyGenerator {
  constructor(options) {
      this.reservedKeys = options.reservedKeys || ['healthz'];
    }
}