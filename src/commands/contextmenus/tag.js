const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  MessageContextMenuCommandInteraction,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ActionRowBuilder
} = require('discord.js');
const { EMOTES } = require('../../util/constants.js');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('Send Tag').setType(ApplicationCommandType.Message),

  /**
   * @param {MessageContextMenuCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Get available tags
    const tags = await interaction.client.database.getFaqQuestions();

    // Filter for SelectMenu
    const options = tags.map((tag) => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(tag.question)
        .setValue(tag.id)
        .setDescription(`Tag ID: ${tag.id}`);
    });

    // Create SelectMenu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('tagSelectMenu')
      .setPlaceholder('Select a tag')
      .addOptions(options)
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Send SelectMenu
    await interaction.editReply({
      content: 'Please select a tag to send to this user using the dropdown below.',
      components: [row]
    });

    // Await SelectMenu
    const filter = (i) => i.customId === 'tagSelectMenu' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async (i) => {
      interaction.editReply({ content: `${EMOTES.loading} Processing...`, components: [] });

      // Get tag
      const questionData = await interaction.client.database.getFaqQuestion(i.values[0]);
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

      // Send tag to the message author\
      const author = interaction.targetMessage.author.id;
      interaction.targetMessage.channel.send({ embeds: [embed], content: `<@${author}>` });

      interaction.editReply({ content: `${EMOTES.success} Tag sent!` });
    });
  }
};
