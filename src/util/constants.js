const config = require('../../config.json');

const EMOTES = {
  success: config.emotes.success,
  error: config.emotes.error,
  loading: config.emotes.loading,
  info: config.emotes.info,
  warning: config.emotes.warning
};


module.exports = {
  EMOTES
};