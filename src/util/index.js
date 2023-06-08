const nanoid = require('nanoid')

async function genRandomId(len) {
  return nanoid.customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', len)();
}

function isValidRegex(s) {
  try {
    const m = s.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
    return m ? !!new RegExp(m[2],m[3])
        : false;
  } catch (e) {
    return false
  }
}

function getThreadById(client, threadId) {
  const guild = client.guilds.cache.get(client.config.guildId);
  const threadChannels = guild.channels.cache.filter((c) => c.isThread());

  return threadChannels.find((c) => c.id === threadId);
}

function transformQuestion(question) {
  // \newline -> actual newline
  question = question.replace(/\\newline/g, '\n');

  return question;
}

module.exports.genRandomId = genRandomId;
module.exports.isValidRegex = isValidRegex;
module.exports.getThreadById = getThreadById;
module.exports.transformQuestion = transformQuestion;
module.exports.database = require('./database');