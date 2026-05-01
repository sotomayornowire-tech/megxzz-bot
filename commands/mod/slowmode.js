const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('⏳ Configura el modo lento en este canal')
    .addIntegerOption(option =>
      option.setName('segundos')
        .setDescription('Segundos entre mensajes (0 = desactivar)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const segundos = interaction.options.getInteger('segundos');
    const channel = interaction.channel;

    await channel.setRateLimitPerUser(segundos);

    const embed = new EmbedBuilder()
      .setColor(segundos === 0 ? '#00FF00' : '#FFA500')
      .setTitle('⏳ Slowmode actualizado')
      .setDescription(segundos === 0 
        ? '✅ El modo lento ha sido **desactivado**.' 
        : `✅ Ahora hay **${segundos} segundos** de cooldown.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};