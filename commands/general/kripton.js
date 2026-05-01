const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('kripton')
        .setDescription('Muestra el estado del addon'),
    async execute(interaction) {
        await interaction.reply('🟩 **Kripton Addon** está activo y funcionando.');
    },
};