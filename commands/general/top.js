const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { leer } = require('../../utils/db');
const fs = require('fs');
const path = require('path');

const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// Crear archivos si no existen
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(path.join(dataDir, 'mensajes.json'))) fs.writeFileSync(path.join(dataDir, 'mensajes.json'), '{}');
if (!fs.existsSync(path.join(dataDir, 'invitaciones.json'))) fs.writeFileSync(path.join(dataDir, 'invitaciones.json'), '{}');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('🏆 Rankings del servidor')
    .addSubcommand(s => s.setName('mensajes').setDescription('Top usuarios con más mensajes'))
    .addSubcommand(s => s.setName('invitaciones').setDescription('Top usuarios con más invitaciones')),

  async execute(interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const archivo = sub === 'mensajes' ? 'mensajes.json' : 'invitaciones.json';
    const emoji = sub === 'mensajes' ? '💬' : '📨';
    const color = sub === 'mensajes' ? '#F4D03F' : '#58D68D';
    const unidad = sub === 'mensajes' ? 'mensajes' : 'invitaciones';

    let datos = {};
    try { datos = leer(archivo); } catch { datos = {}; }

    const sorted = Object.entries(datos).sort(([, a], [, b]) => b - a).slice(0, 10);

    if (!sorted.length) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(color)
          .setTitle(`${emoji} Top — ${sub}`)
          .setDescription('> Aún no hay datos registrados. ¡Empieza a participar!')
        ]
      });
    }

    const filas = await Promise.all(sorted.map(async ([id, count], i) => {
      const user = await interaction.client.users.fetch(id).catch(() => null);
      const nombre = user ? `**${user.username}**` : '*Usuario desconocido*';
      return `${medallas[i]} ${nombre} — \`${count}\` ${unidad}`;
    }));

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Top 10 — ${sub.charAt(0).toUpperCase() + sub.slice(1)}`)
      .setDescription(filas.join('\n'))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${interaction.guild.name} • Actualizado ahora mismo` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};