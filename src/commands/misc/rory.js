const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('rory').setDescription('Rory the cat!'),
  /**
   * @param {CommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {

	await interaction.deferReply();

	const rory = await fetch(`https://rory.cat/purr/`, {
	  headers: { Accept: 'application/json' },
	}).then((r) => r.json());
  
	if (rory.error) {
	  await interaction.editReply({
		embeds: [
		  {
			title: 'Error!',
			description: rory.error,
		  },
		],
	  });
  
	  return;
	}
  
	await interaction.editReply({
	  embeds: [
		{
		  title: 'Rory :3',
		  url: `https://rory.cat/id/${rory.id}`,
		  image: {
			url: rory.url,
		  },
		  footer: {
			text: `ID ${rory.id}`,
		  },
		},
	  ],
	});

  }
};

