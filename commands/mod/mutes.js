const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Silencia a un usuario temporalmente')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a silenciar')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('minutos')
        .setDescription('Duración del mute (en minutos)')
        .setMinValue(1)
        .setMaxValue(1440)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón del mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const minutos = interaction.options.getInteger('minutos');
    const razon = interaction.options.getString('razon') || 'No especificada';

    if (!target) return interaction.reply({ content: '❌ No encontré a ese usuario.', ephemeral: true });

    const durationMs = minutos * 60 * 1000;

    await target.timeout(durationMs, razon);

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔇 Usuario silenciado')
      .setDescription(`**${target.user.tag}** ha sido silenciado por **${minutos} minutos**.`)
      .addFields({ name: 'Razón', value: razon })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};