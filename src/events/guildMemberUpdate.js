const { Events, Interaction } = require('discord.js');

module.exports = {
	name: Events.GuildMemberUpdate,
	/**
	 * @param {Interaction} interaction
	 * @returns {Promise<void>}
	 */
	async execute(oldMember, newMember) {
		if(newMember.nickname && oldMember.nickname !== newMember.nickname) {
			for (const word of slurs) {
				if (newMember.nickname && newMember.nickname.match(word)) {
					newMember.kick({ reason: "Bad Nicknames aren't allowed" });
					break;
				}
			}
		}
	}
};