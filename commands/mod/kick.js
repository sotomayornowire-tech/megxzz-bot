const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario del servidor')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const objetivo = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon') ?? 'Sin razón especificada';

    if (!objetivo.kickable)
      return interaction.reply({ content: '❌ No puedo expulsar a ese usuario.', ephemeral: true });

    await objetivo.kick(razon);
    await interaction.reply(`👢 **${objetivo.user.username}** fue expulsado.\n📝 Razón: ${razon}`);
  },
};
