const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Abre el canal nuevamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.id, {
      SendMessages: null,
      AddReactions: null,
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🔓 Canal desbloqueado')
      .setDescription('Este canal ha sido abierto nuevamente.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
