const { Events, Interaction } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  /**
   * @param {Interaction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) interaction.client.logger.warning(`Command ${interaction.commandName} not found.`);

    try {
      command.execute(interaction);
    } catch (error) {
      interaction.client.logger.error(error);

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({
          content: ':x: There was an error while executing this command!',
          ephemeral: true
        });
      } else {
        interaction.reply({
          content: ':x: There was an error while executing this command!',
          ephemeral: true
        });
      }
    }
  }
};
