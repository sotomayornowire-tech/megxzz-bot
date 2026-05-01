const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Banea a un usuario del servidor')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razón del baneo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    // 1. Avisamos a Discord que estamos procesando (evita el "La aplicación no respondió")
    await interaction.deferReply({ ephemeral: true });

    const objetivo = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon') ?? 'Sin razón especificada';

    // Validación: ¿El usuario existe en el servidor?
    if (!objetivo) {
      return interaction.editReply({ content: '❌ No se pudo encontrar a ese usuario en este servidor.' });
    }

    // Validación: ¿El bot tiene permisos jerárquicos para banearlo?
    if (!objetivo.bannable) {
      return interaction.editReply({ content: '❌ No puedo banear a ese usuario. Su rol es superior al mío o no tengo permisos suficientes.' });
    }

    try {
      // Ejecutamos el ban
      await objetivo.ban({ reason: razon });

      // Creamos un embed visualmente mejor (estilo RB3/Seguridad)
      const embed = new EmbedBuilder()
        .setColor('#ED4245') // Rojo pasión
        .setTitle('🔨 Usuario Baneado')
        .addFields(
          { name: '👤 Usuario', value: `${objetivo.user.tag} (${objetivo.id})`, inline: true },
          { name: '🛡️ Moderador', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Razón', value: razon }
        )
        .setTimestamp()
        .setFooter({ text: `ID del objetivo: ${objetivo.id}` });

      // 2. IMPORTANTE: Usamos editReply porque ya usamos deferReply arriba
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `❌ Hubo un error al intentar banear al usuario: \`${error.message}\`` });
    }
  },
};