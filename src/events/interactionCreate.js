const { Events, Interaction } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  /**
   * @param {Interaction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    const contextHandler = interaction.client.contextMenus.get(interaction.commandName);
    if (!command) interaction.client.logger.warning(`Command ${interaction.commandName} not found.`);

    if (interaction.isAutocomplete()) {
      // Check if the command has an autocomplete function
      if (!command.autocomplete) return;
      command.autocomplete(interaction);
    }

    if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
      if (!contextHandler) interaction.client.logger.warning(`Context menu ${interaction.commandName} not found.`);
      contextHandler.execute(interaction);
    }

    if (!interaction.isChatInputCommand()) return;

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
