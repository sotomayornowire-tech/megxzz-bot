const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const respuestas = [
  { texto: '✅ Sí, definitivamente.', color: '#2ECC71' },
  { texto: '✅ Todas las señales dicen que sí.', color: '#2ECC71' },
  { texto: '✅ Sin duda alguna.', color: '#2ECC71' },
  { texto: '✅ Puedes contar con ello.', color: '#2ECC71' },
  { texto: '🤔 Pregunta en otro momento.', color: '#F39C12' },
  { texto: '🤔 Mejor no te digo ahora.', color: '#F39C12' },
  { texto: '🤔 No es el momento de saberlo.', color: '#F39C12' },
  { texto: '❌ No cuentes con ello.', color: '#E74C3C' },
  { texto: '❌ La respuesta es no.', color: '#E74C3C' },
  { texto: '❌ Mis fuentes dicen que no.', color: '#E74C3C' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🎱 Consulta a la bola mágica')
    .addStringOption(o => o.setName('pregunta').setDescription('¿Qué quieres saber?').setRequired(true)),

  async execute(interaction) {
    const pregunta = interaction.options.getString('pregunta');
    const resp = respuestas[Math.floor(Math.random() * respuestas.length)];

    const embed = new EmbedBuilder()
      .setColor(resp.color)
      .setTitle('🎱 La Bola Mágica ha hablado')
      .addFields(
        { name: '❓ Tu pregunta', value: `> ${pregunta}` },
        { name: '🔮 Respuesta', value: `> ${resp.texto}` }
      )
      .setFooter({ text: `Consultado por ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};