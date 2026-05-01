const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 Desbanea a un usuario por su ID')
    .addStringOption(o => o.setName('id').setDescription('ID del usuario baneado').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const id = interaction.options.getString('id');
    const razon = interaction.options.getString('razon') ?? 'Sin razón';

    try {
      const usuario = await interaction.client.users.fetch(id);
      await interaction.guild.members.unban(id, razon);

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('🔓 Usuario desbaneado')
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${id})`, inline: true },
          { name: 'Razón', value: razon }
        )
        .setFooter({ text: `Desbaneado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: '❌ No encontré ese usuario o no está baneado.', ephemeral: true });
    }
  },
};