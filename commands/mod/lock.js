const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Cierra el canal (solo staff puede escribir)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.id, {
      SendMessages: false,
      AddReactions: false,
    });

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔒 Canal bloqueado')
      .setDescription('Este canal ha sido cerrado temporalmente.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};