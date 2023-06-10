const {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AutocompleteInteraction
} = require('discord.js');
const { EMOTES } = require('../../util/constants.js');
const logger = require('logger');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('FAQ commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('send')
        .setDescription('Send a FAQ manually to a user')
        .addStringOption((option) =>
          option
            .setName('question')
            .setDescription('The common Q to post an A to')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addUserOption((option) => option.setName('user').setDescription('The user you want to mention'))
    )
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List all FAQ questions'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a FAQ question')
        .addStringOption((option) =>
          option.setName('question').setDescription('The common Q to post an A to').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('answer').setDescription('The answer to the question').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('pattern')
            .setDescription('The regex pattern that would trigger a auto response')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('containspattern')
            .setDescription('words to trigger a auto response, separated by comma')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('edit')
        .setDescription("Edit a FAQ question using it's ID")
        .addStringOption((option) => option.setName('id').setDescription('The ID of the question').setRequired(true))
        .addStringOption((option) => option.setName('question').setDescription('The new question').setRequired(false))
        .addStringOption((option) => option.setName('answer').setDescription('The new answer').setRequired(false))
        .addStringOption((option) => option.setName('pattern').setDescription('The new pattern').setRequired(false))
        .addStringOption((option) =>
          option.setName('containspattern').setDescription('The new containspattern').setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription("Delete a FAQ question using it's ID")
        .addStringOption((option) => option.setName('id').setDescription('The ID of the question').setRequired(true))
    ),

  /**
   * @param {AutocompleteInteraction} interaction
   * @returns {Promise<void>}
   */
  async autocomplete(interaction) {
    const question = interaction.options.getFocused();
    const questions = await interaction.client.utils.database.findLikeQuestionOrAnswer(question);
    const questionOptions = questions
      ? questions.map((question) => ({ name: `${question.id} - ${question.question}`, value: question.id }))
      : [];

    await interaction.respond(questionOptions);
  },

  /**
   * @param {CommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const isTrusted = interaction.member.roles.cache.has(interaction.client.config.roles.trusted);
    const isModOrHigher = interaction.member.roles.cache.has(interaction.client.config.roles.mod);

    // Defer emphemerally if send, otherwise defer normally
    if (subcommand === 'send') await interaction.deferReply({ ephemeral: true });
    else await interaction.deferReply();

    switch (subcommand) {
      case 'send': {
        const question = interaction.options.getString('question');
        const user = interaction.options.getUser('user') ?? null;
        const questionData = await interaction.client.utils.database.getFaqQuestion(question);

        if (!questionData)
          return interaction.editReply({
            content: `${EMOTES.error} No FAQ question found for \`${question}\``,
            ephemeral: true
          });

        const transformedMessage = interaction.client.utils.transformQuestion(questionData.answer);
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

        if (user) interaction.channel.send({ content: `<@${user.id}>`, embeds: [embed] });
        else interaction.channel.send({ embeds: [embed] });

        await interaction.editReply({
          content: `${EMOTES.success} FAQ question sent successfully${user ? `, mentioning <@${user.id}>` : ''}`
        });
        break;
      }

      case 'add': {
        if (!isTrusted)
          return interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });

        const question = interaction.options.getString('question');
        const answer = interaction.options.getString('answer');
        const pattern = interaction.options.getString('pattern') ?? null;
        const containsPattern = interaction.options.getString('containspattern') ?? null;

        if (pattern) {
          const isValidRegex = interaction.client.utils.isValidRegex(pattern);
          if (!isValidRegex)
            return interaction.editReply({ content: `${EMOTES.error} Invalid regex pattern provided` });
        }

        if (containsPattern) {
          // Ensure that the containsPattern is valid (comma separated words)
          const words = containsPattern.split(',');
          if (words.length < 2)
            return interaction.editReply({
              content: `${EMOTES.error} Invalid containsPattern provided - wanted at least two word(s) to match against.\nExample: \`word1,word2\``
            });
        }

        try {
          const id = await interaction.client.utils.database.addFaqQuestion(
            question,
            answer,
            pattern,
            containsPattern,
            interaction.user.id
          );
          await interaction.editReply({ content: `${EMOTES.success} Added FAQ question with ID \`${id}\`` });
        } catch (error) {
          await interaction.editReply({
            content: `${EMOTES.error} Failed to add FAQ question - please ping sticks#2701 for more info`
          });

          interaction.client.logger.error(error);
        }

        break;
      }

      case 'edit': {
        if (!isTrusted)
          return interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });

        const id = interaction.options.getString('id');
        const question = interaction.options.getString('question') ?? null;
        const answer = interaction.options.getString('answer') ?? null;
        const pattern = interaction.options.getString('pattern') ?? null;
        const containsPattern = interaction.options.getString('containspattern') ?? null;
        const questionData = await interaction.client.utils.database.getFaqQuestion(id);

        if (!question && !answer && !pattern && !containsPattern)
          return interaction.editReply({ content: `${EMOTES.error} You must provide at least one field to edit` });
        if (!questionData)
          return interaction.editReply({ content: `${EMOTES.error} No FAQ question found with ID \`${id}\`` });

        if (pattern) {
          const isValidRegex = interaction.client.utils.isValidRegex(pattern);
          if (!isValidRegex)
            return interaction.editReply({ content: `${EMOTES.error} Invalid regex pattern provided` });
        }

        if (containsPattern) {
          // Ensure that the containsPattern is valid (comma separated words)
          const words = containsPattern.split(',');
          if (words.length < 2)
            return interaction.editReply({
              content: `${EMOTES.error} Invalid containsPattern provided - wanted at least two word(s) to match against.\nExample: \`word1,word2\``
            });
        }

        // Update the question with the updated fields. If a field is null, it will not be updated and needs to use the existing value
        try {
          await interaction.client.utils.database.editFaqQuestion(
            id,
            question ?? questionData.question,
            answer ?? questionData.answer,
            pattern ?? questionData.pattern,
            containsPattern ?? questionData.containsPattern
          );
          await interaction.editReply({ content: `${EMOTES.success} FAQ question updated successfully` });
        } catch (error) {
          await interaction.editReply({
            content: `${EMOTES.error} Failed to edit FAQ question - please ping sticks#2701 for more info`
          });

          logger.error(error);
        }

        break;
      }

      case 'delete': {
        const id = interaction.options.getString('id');
        const questionData = await interaction.client.utils.database.getFaqQuestion(id);

        if (!questionData)
          return interaction.editReply({ content: `${EMOTES.error} No FAQ question found with ID \`${id}\`` });

        if (!isModOrHigher && questionData.createdBy !== interaction.user.id)
          return interaction.editReply({
            content: `${EMOTES.error} You do not have permission to use this command.\nOnly mods or the creator of the question can delete FaQs`
          });

        // Ask for confirmation
        const actionRow = new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setCustomId(`faq-delete-${id}`)
            .setLabel('Confirm FaQ deletion')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`faq-delete-cancel-${id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        ]);

        await interaction.editReply({
          content: `${EMOTES.warning} Are you sure you want to delete this FaQ? **This action is not revserable!**`,
          components: [actionRow]
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (i) => {
          if (i.customId === `faq-delete-${id}`) {
            await interaction.client.utils.database.deleteFaqQuestion(id);
            await i.update({ content: `${EMOTES.success} FaQ deleted successfully`, components: [] });
            collector.stop();
          } else if (i.customId === `faq-delete-cancel-${id}`) {
            await i.update({ content: `${EMOTES.info} FaQ deletion cancelled`, components: [] });
            collector.stop();
          }
        });

        break;
      }

      case 'list': {
        const questions = await interaction.client.utils.database.getFaqQuestions();

        if (questions.length < 1)
          return interaction.editReply({ content: `${EMOTES.error} No FAQ questions found in the database :(` });

        const questionFields = questions.map((question) => {
          return {
            name: `Question ID: ${question.id}`,
            value: `**Question:** ${question.question}\n**Answer:** ${question.answer}\n**Pattern:** ${
              question.pattern ?? 'No Pattern for this question'
            }\n**ContainsPattern:** ${question.containsPattern ?? 'No keywords for this question'}\n**Created By:** <@${
              question.createdBy
            }>`
          };
        });

        const embed = new EmbedBuilder()
          .setTitle('FAQ Questions')
          .setDescription(`There are currently ${questions.length} FAQ questions in the database`)
          .setColor('#00ff00')
          .addFields(questionFields);

        await interaction.editReply({ embeds: [embed] });

        break;
      }
    }
  }
};
