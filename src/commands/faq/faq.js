const { SlashCommandBuilder, EmbedBuilder, CommandInteraction } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('FAQ Replying to a user, or a message. Limited to Trusted Users.')
    .addStringOption((option) =>
      option.setName('question').setDescription('The common Q to post an A to').setRequired(true).addChoices(
        {
          name: 'Is my mod affected?',
          value: 'mod_affected'
        },
        {
          name: 'What is this server?',
          value: 'server'
        },
        {
          name: 'Why are Curseforge/Modrinth not doing anything?',
          value: 'cf_modrinth_nothing'
        },
        {
          name: 'Is there an exploit in Minecraft itself?',
          value: 'not_clientsided'
        }
      )
    )
    .addUserOption((option) => option.setName('user').setDescription('The user you want to mention')),
  /**
   * @param {CommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const question = interaction.options.getString('question', true);
    const user = interaction.options.getUser('user') ?? null;

    // Ensure they have the trusted role
    if (!interaction.member.roles.cache.has('1115852848111034398')) return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

    const valueMap = [
      {
        value: 'mod_affected',
        title: 'Is my mod affected?',
        desc: "Due to the size of this issue, we can't confirm for each mod. If you think you have a infected mod, please follow [this guide](https://prismlauncher.org/news/cf-compromised-alert/#what-can-i-do) to check if your mod is affected and what to do if it is."
      },
      {
        value: 'server',
        title: 'What is this server?',
        desc: 'This server is a community effort to help modders and users alike to get information about the current situation. We are not affiliated with CurseForge or Modrinth.'
      },
      {
        value: 'cf_modrinth_nothing',
        title: 'Why are Curseforge/Modrinth not doing anything?',
        desc: 'Curseforge and Modrinth are aware of the situation and are actively working with us to add detection and prevention to their platforms. We are working with them to ensure that the situation is resolved as quickly as possible.'
      },
      {
        value: 'not_clientsided',
        title: 'Is there an exploit in Minecraft itself? Can a server with infected plugins spread the virus to me?',
        desc: 'No, there is no exploit that is being abuse in mincraft itself. The exploit is in the mod itself, and only tries to touch the SERVER - not the client.'
      }
    ];

    // Find the value in the map
    const value = valueMap.find((v) => v.value === question);
    if (!value) return interaction.reply({ content: 'Invalid question.', ephemeral: true });

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle(value.title)
      .setDescription(value.desc)
      .setColor('#FF0000')
      .setFooter({
        text: `FAQ requested by ${interaction.user.tag} ${user ? `for ${user.tag}` : ''}`
      });

    // Send the embed
    if (user)
      return interaction.reply({ embeds: [embed], allowedMentions: { parse: ['users'] }, content: user.toString() });
    else return interaction.reply({ embeds: [embed] });
  }
};
