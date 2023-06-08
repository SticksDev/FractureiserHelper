const nanoid = require('nanoid')

async function genRandomId() {
  return nanoid.customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10)();
}

module.exports.genRandomId = genRandomId;