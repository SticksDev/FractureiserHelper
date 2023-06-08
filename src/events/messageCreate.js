const { Events, Client, ActivityType, Message, ChannelType, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.MessageCreate,
  /**
   * @param {Message} message
   * @returns {Promise<void>}
   */
  async execute(message) {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;
    if (!config.watchedChannels.includes(message.channel.id)) return;

    const isPossiblyQuestion = await message.client.database.findLikeQuestionOrAnswer(message.content);

    if (!isPossiblyQuestion || isPossiblyQuestion.length === 0) {
      return;
    }

    async function sendQuestion(question) {
      const transformedMessage = message.client.utils.transformQuestion(question.answer);

      const embed = new EmbedBuilder()
        .setTitle(`Automated reply: ${question.question}`)
        .setDescription(`${transformedMessage}\n\nDid I get it right? React with 👍 or 👎`)
        .setColor('#00BFFF')
        .setFooter({
          text: `FAQ ID: ${question.id}`
        });

      const msg = await message.reply({ embeds: [embed] });
      await msg.react('👍');
      await msg.react('👎');
    }

    // Loop through the questions
    for (const question of isPossiblyQuestion) {
      const contentLower = message.content.toLowerCase();

      if (question.pattern && contentLower.match(question.pattern)) {
        sendQuestion(question);
        break;
      }

      if (question.containsPattern) {
        const keywords = question.containsPattern.split(',');

        if (keywords.some((keyword) => contentLower.includes(keyword))) {
          sendQuestion(question);
          break;
        }
      }
    }
  }
};
