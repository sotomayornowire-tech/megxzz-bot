const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia a un usuario temporalmente')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a silenciar').setRequired(true))
    .addIntegerOption(o => o.setName('minutos').setDescription('Cuántos minutos').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const objetivo = interaction.options.getMember('usuario');
    const minutos = interaction.options.getInteger('minutos');
    const razon = interaction.options.getString('razon') ?? 'Sin razón especificada';

    if (minutos < 1 || minutos > 40320)
      return interaction.reply({ content: '❌ El tiempo debe ser entre 1 y 40320 minutos (28 días).', ephemeral: true });

    await objetivo.timeout(minutos * 60 * 1000, razon);
    await interaction.reply(`🔇 **${objetivo.user.username}** silenciado por **${minutos} minuto(s)**.\n📝 Razón: ${razon}`);
  },
};
