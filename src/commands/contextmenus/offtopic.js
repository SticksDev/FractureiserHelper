const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  MessageContextMenuCommandInteraction,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require('discord.js');
const { EMOTES } = require('../../util/constants.js');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Tag: Offtopic').setType(ApplicationCommandType.Message),

  /**
   * @param {MessageContextMenuCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const questionData = await interaction.client.database.getFaqQuestion('j0KuPIxVzR').catch(() => null);

    if (!questionData) {
      return interaction.editReply({
        content: 'Somone deleted the offtopic tag, please let sticks know.',
        ephemeral: true
      });
    }

    const transformedMessage = await interaction.client.utils.transformQuestion(questionData.answer);
    const embed = new EmbedBuilder()
      .setTitle(`${questionData.question}`)
      .setDescription(`${transformedMessage}`)
      .setColor('#00BFFF')
      .setFooter({
        text: `FAQ ID: ${questionData.id} | Requested by ${
          interaction.user.discriminator === '0' ? interaction.user.username : interaction.user.tag
        }`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      });

    // Send tag to the message author
    const author = interaction.targetMessage.author.id;
    interaction.targetMessage.channel.send({ embeds: [embed], content: `<@${author}>` });
    interaction.editReply({ content: `${EMOTES.success} Offtopic tag sent to <@${author}>.` });
  }
};
