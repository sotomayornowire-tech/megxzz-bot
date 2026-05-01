const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { leer, guardar } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Advierte a un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
    .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const objetivo = interaction.options.getUser('usuario');
    const razon = interaction.options.getString('razon');

    const datos = leer('warns.json');
    if (!datos[objetivo.id]) datos[objetivo.id] = [];
    datos[objetivo.id].push({ razon, fecha: new Date().toISOString(), porId: interaction.user.id });
    guardar('warns.json', datos);

    const totalWarns = datos[objetivo.id].length;

    const embed = new EmbedBuilder()
      .setColor('#F39C12')
      .setTitle('⚠️ Advertencia emitida')
      .addFields(
        { name: 'Usuario', value: `${objetivo}`, inline: true },
        { name: 'Advertencias totales', value: `${totalWarns}`, inline: true },
        { name: 'Razón', value: razon }
      )
      .setFooter({ text: `Advertido por ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // DM al usuario
    await objetivo.send({
      embeds: [new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle(`⚠️ Has recibido una advertencia en ${interaction.guild.name}`)
        .addFields(
          { name: 'Razón', value: razon },
          { name: 'Total de advertencias', value: `${totalWarns}` }
        )
        .setTimestamp()
      ]
    }).catch(() => {});
  },
};
