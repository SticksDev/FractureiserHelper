const { REST, Routes } = require('discord.js');
const logger = require('logger');
const config = require('../config.json');
const path = require('node:path');
const fs = require('node:fs');

const { clientId, guildId, token } = config;

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN ?? token);

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // if the file has a _ in front of it, its disabled and should not be loaded
    if (file.startsWith('_')) {
      logger.warning(`The command at ${filePath} is disabled and will not be loaded.`);
      continue;
    }

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      logger.info(`Adding command ${command.data.name} to be registered.`);
    } else {
      logger.warning(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

(async () => {
	try {
	  logger.info('Started refreshing application (/) commands.');
  
	  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  
	  logger.info('Successfully reloaded application (/) commands.');
	} catch (error) {
	  logger.warning('Failed to reload application (/) commands.');
	  logger.warning(error);
	}
  })();