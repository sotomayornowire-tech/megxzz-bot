const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Borra una cantidad de mensajes en el canal')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de mensajes a borrar (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const cantidad = interaction.options.getInteger('cantidad');

    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(cantidad, true);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🧹 Purge completado')
        .setDescription(`Se borraron **${deleted.size}** mensajes.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    } catch (err) {
      await interaction.editReply({
        content: '❌ No se pudieron borrar los mensajes. Prueba con menos de 100 o mensajes más recientes.',
        ephemeral: true
      });
    }
  },
};
