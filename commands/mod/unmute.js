const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Quita el silencio a un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const objetivo = interaction.options.getMember('usuario');

    if (!objetivo.isCommunicationDisabled())
      return interaction.reply({ content: '❌ Ese usuario no está silenciado.', ephemeral: true });

    await objetivo.timeout(null);

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('🔊 Silencio removido')
      .setDescription(`${objetivo.user.username} puede volver a hablar.`)
      .setFooter({ text: `Removido por ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
