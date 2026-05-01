const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('info').setDescription('Info de Kripton Addon'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🟩 Kripton Addon')
            .setColor(0x00FF00)
            .setDescription('El mejor addon para Meteor Client.')
            .addFields({ name: 'Estado', value: 'Operativo', inline: true });
        await interaction.reply({ embeds: [embed] });
    },
};