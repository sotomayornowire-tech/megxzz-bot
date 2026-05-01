const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Latencia'),
    async execute(interaction) {
        await interaction.reply(`🏓 Latencia: \`${interaction.client.ws.ping}ms\``);
    },
};