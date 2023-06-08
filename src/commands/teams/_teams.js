const {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} = require('discord.js');
const package = require('../../../package.json');
const os = require('os');
const { EMOTES } = require('../../util/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teams')
    .setDescription('Team Managment commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a team and bind the current forum channel to it')
        .addStringOption((option) => option.setName('name').setDescription('The name of the team').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a team and unbind the forum channel from it')
        .addStringOption((option) => option.setName('name').setDescription('The name of the team').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('join')
        .setDescription('Join a team')
        .addStringOption((option) =>
          option.setName('name').setDescription('The name of the team').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName('leave').setDescription('Leave a team you are in'))
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List all teams and their members')),

  /**
   * @param {AutocompleteInteraction} interaction
   * @returns {Promise<void>}
   */
  async autocomplete(interaction) {
    const team = interaction.options.getFocused();
    const teams = await interaction.client.database.getTeamLikeName(team);

    const options = teams.map((team) => ({
      name: `${team.name} (${JSON.parse(team.members).length} members)`,
      value: team.id
    }));

    interaction.respond(options);
  },

  /**
   * @param {CommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    const isTrusted = interaction.member.roles.cache.has(interaction.client.config.roles.trusted);
    const isModOrHigher = interaction.member.roles.cache.has(interaction.client.config.roles.mod);

    await interaction.deferReply();

    switch (subcommand) {
      case 'create': {
        // if (!isModOrHigher)
        //   return interaction.editReply({
        //     content: `${EMOTES.error} You must be a moderator or higher to use this command!`
        //   });

        // Ensure the user is in a forum channel
        if (
          interaction.channel.type != ChannelType.PublicThread &&
          interaction.channel.type != ChannelType.PrivateThread
        )
          return interaction.editReply({ content: 'You must be in a forum channel to use this command' });

        const name = interaction.options.getString('name');

        // Create the team
        const exists = await interaction.client.database.teamExists(interaction.channel.id);
        if (exists)
          return interaction.editReply({ content: `${EMOTES.error} a team is already bound with this channel!` });

        const team = await interaction.client.database.createTeam(name, interaction.channel.id);

        // Reply to the user'
        interaction.editReply({
          content: `${EMOTES.success} Team ${name} created with UUID \`${team}\`, bound to forum channel <#${interaction.channel.id}>`
        });

        break;
      }

      case 'delete': {
        // if (!isModOrHigher)
        //   return interaction.editReply({
        //     content: `${EMOTES.error} You must be a moderator or higher to use this command!`
        //   });

        const name = interaction.options.getString('name');

        // Get the team
        const team = await interaction.client.database.getTeamByName(name);

        if (!team) return interaction.editReply({ content: `${EMOTES.error} Team not found!` });

        // Delete the team
        await interaction.client.database.deleteTeam(team.id);

        // Reply to the user
        interaction.editReply({
          content: `${EMOTES.success} Team ${name} deleted with UUID \`${team.id}\`, unbound from forum channel <#${team.forumId}>`
        });

        break;
      }

      case 'join': {
        if (!isTrusted)
          return interaction.editReply({ content: `${EMOTES.error} You must be trusted to use this command!` });

        // Ensure the team exists
        const id = interaction.options.getString('name');

        // Get the team
        const team = await interaction.client.database.getTeam(id);

        if (!team) return interaction.editReply({ content: `${EMOTES.error} Team not found!` });

        const alreadyOnTeam = Array.from(JSON.parse(team.members)).includes(interaction.member.id);
        if (alreadyOnTeam) return interaction.editReply({ content: `${EMOTES.error} You are already on this team!` });

        // Add the member to the team
        await interaction.client.database.addTeamMemeber(team.id, interaction.member.id);

        // Reply to the user
        return interaction.editReply({
          content: `${EMOTES.success} You have joined team ${team.name}.`
        });

        // Send a message to the team channel
        const channel = interaction.client.utils.getThreadById(interaction.client, team.forumId);
        if (!channel) return;

        const embed = new EmbedBuilder()
          .setTitle('Team Member Joined')
          .setDescription(`<@${interaction.member.id}> has joined the team`)
          .setColor('#FF0000')
          .setFooter({
            text: `Team ID: ${team.id}`
          });

        await channel.send({ embeds: [embed] });
        break;
      }

      case 'leave': {
        if (!isTrusted)
          return interaction.editReply({ content: `${EMOTES.error} You must be trusted to use this command!` });

        // Get teams that the user is on
        const teams = await interaction.client.database.getTeams();
        const teamsFiltered = teams.filter((team) => {
          const membersParsed = JSON.parse(team.members);
          return membersParsed.includes(interaction.member.id);
        });

        if (teamsFiltered.length == 0)
          return interaction.editReply({ content: `${EMOTES.error} You are not on any teams!` });

        // Dropdown for the team they want to leave
        const options = teamsFiltered.map((team) => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(team.name)
            .setValue(team.id)
            .setDescription(`Team ID: ${team.id}`);
        });

        const select = new StringSelectMenuBuilder()
          .setCustomId('team-del')
          .setPlaceholder('Select a team to leave')
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        // Reply to the user
        interaction.editReply({
          content: 'Select a team to leave',
          components: [row]
        });

        // Wait for the user to select a team
        const filter = (i) => i.customId == 'team-del' && i.user.id == interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (i) => {
          // Get the team
          const team = await interaction.client.database.getTeam(i.values[0]);

          // Remove the member from the team
          await interaction.client.database.removeTeamMemeber(team.id, interaction.member.id);

          // Reply to the user
          i.update({
            content: `${EMOTES.success} You have left team ${team.name}.`,
            components: []
          });

          const channel = interaction.client.utils.getThreadById(interaction.client, team.forumId);
          const embed = new EmbedBuilder()
            .setTitle('Team Member Left')
            .setDescription(`<@${interaction.member.id}> has left the team`)
            .setColor('#FF0000')
            .setFooter({
              text: `Team ID: ${team.id}`
            });

          collector.stop();

          if (!channel) return;
          await channel.send({ embeds: [embed] });
        });

        break;
      }

      case 'list': {
        // Get the teams
        const teams = await interaction.client.database.getTeams();

        // Create the embed
        const embed = new EmbedBuilder()
          .setTitle(`Teams (${teams.length})`)
          .setDescription(
            teams
              .map((team) => {
                const membersParsed = JSON.parse(team.members);
                return `**${team.name}** - (${membersParsed.length} members)`;
              })
              .join('\n')
          )
          .setColor('#00BFFF');

        // Reply to the user
        interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  }
};
