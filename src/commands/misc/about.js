const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const package = require('../../../package.json');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder().setName('about').setDescription('Shows information about FractureiserHelper'),
  /**
   * @param {CommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('About FractureiserHelper')
      .setDescription(
        'Below is some information about FractureiserHelper.\nThis bot was created by sticks#2701.'
      )
      .addFields(
        {
          name: 'Node.js Version',
          value: process.version
        },
        {
          name: 'Discord.js Version',
          value: require('discord.js').version
        },
        {
          name: 'Bot Version',
          value: package.version
        },
        {
          name: 'Ram Usage',
          value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        }
      )
      .setColor('#00BFFF');

    await interaction.reply({ embeds: [embed] });
  }
};
