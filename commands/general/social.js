const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const ACCIONES = {
    abrazar:    { endpoint: 'hug',      tipo: 'target', color: '#FF85A1', emoji: '🫂', frases: ['{a} le dio un abrazo enorme a {b}.', '{a} abrazó a {b} sin previo aviso.'] },
    acariciar:  { endpoint: 'pat',      tipo: 'target', color: '#FFD700', emoji: '✋', frases: ['{a} le acarició la cabeza a {b}.', '{a} le hizo pat pat pat a {b}.'] },
    besar:      { endpoint: 'kiss',     tipo: 'target', color: '#FF6B9D', emoji: '💋', frases: ['{a} le plantó un beso a {b}.', '{a} besó a {b}.'] },
    morder:     { endpoint: 'bite',     tipo: 'target', color: '#FF4444', emoji: '🦷', frases: ['{a} mordió a {b}.', '{a} atacó a {b} con los dientes.'] },
    mimar:      { endpoint: 'cuddle',   tipo: 'target', color: '#FFB3C6', emoji: '🥰', frases: ['{a} está mimando a {b}.', '{a} y {b} están en modo cuddle.'] },
    lamer:      { endpoint: 'lick',     tipo: 'target', color: '#88D5A0', emoji: '👅', frases: ['{a} lamió a {b}.', '{a} decidió lamer a {b}.'] },
    alimentar:  { endpoint: 'feed',     tipo: 'target', color: '#FFA94D', emoji: '🍱', frases: ['{a} le dio de comer a {b}.', '{a} alimentó a {b}.'] },
    cosquillas: { endpoint: 'tickle',   tipo: 'target', color: '#FFE066', emoji: '🤣', frases: ['{a} está haciéndole cosquillas a {b}.', 'Cosquillas activas: {a} → {b}.'] },
    golpear:    { endpoint: 'punch',    tipo: 'target', color: '#FF6B35', emoji: '👊', frases: ['{a} le pegó a {b}.', '{a} atacó a {b} con fuerza.'] },
    abofetear:  { endpoint: 'slap',     tipo: 'target', color: '#FF4757', emoji: '👋', frases: ['{a} le dio una cachetada a {b}.', '{a} → bofetada → {b}.'] },
    patear:     { endpoint: 'kick',     tipo: 'target', color: '#FF6348', emoji: '🦵', frases: ['{a} le pegó una patada a {b}.', 'Patada registrada para {b}.'] },
    lanzar:     { endpoint: 'yeet',     tipo: 'target', color: '#ECCC68', emoji: '🚀', frases: ['{a} lanzó a {b} al vacío.', '{b} fue lanzado por {a}.'] },
    ignorar:    { endpoint: 'baka',     tipo: 'target', color: '#747D8C', emoji: '🙄', frases: ['{a} ignoró olímpicamente a {b}.', '{a} le dijo "baka" a {b}.'] },
    molestar:   { endpoint: 'poke',     tipo: 'target', color: '#70A1FF', emoji: '👉', frases: ['{a} no para de molestar a {b}.', '{a} eligió a {b} como víctima.'] },
    llorar:     { endpoint: 'cry',      tipo: 'solo',   color: '#74B9FF', emoji: '😭', frases: ['{a} está llorando.', 'Las lágrimas de {a} llegaron al chat.'] },
    reir:       { endpoint: 'laugh',    tipo: 'solo',   color: '#FFEAA7', emoji: '😂', frases: ['{a} se está muriendo de risa.', '{a} encontró algo muy gracioso.'] },
    sonrojarse: { endpoint: 'blush',    tipo: 'solo',   color: '#FD79A8', emoji: '😳', frases: ['{a} está rojo como un tomate.', '{a} se sonrojó de repente.'] },
    bailar:     { endpoint: 'dance',    tipo: 'solo',   color: '#A29BFE', emoji: '💃', frases: ['{a} se puso a bailar.', '{a} está bailando.'] },
    encogerse:  { endpoint: 'shrug',    tipo: 'solo',   color: '#B2BEC3', emoji: '🤷', frases: ['{a} no sabe, no contesta.', '{a}: "no sé y no es mi problema".'] },
    saludar:    { endpoint: 'wave',     tipo: 'target', color: '#55EFC4', emoji: '👋', frases: ['{a} saluda a {b}.', '{a} le hizo señas a {b}.'] },
    chocala:    { endpoint: 'highfive', tipo: 'target', color: '#00CEC9', emoji: '🙌', frases: ['{a} y {b} se chocaron las manos.', 'High five entre {a} y {b}.'] },
    guiñar:     { endpoint: 'wink',     tipo: 'target', color: '#FDCB6E', emoji: '😉', frases: ['{a} le guiñó el ojo a {b}.', '{a} le hizo un guiño a {b}.'] },
};

// ─── GIF: intenta v2, si falla cae a v1 ────────────────────────────────────────
async function getGif(endpoint) {
    // Intento 1: API v2
    try {
        const res = await axios.get(`https://nekos.best/api/v2/${endpoint}`, {
            timeout: 6000,
            headers: { 'Accept': 'application/json' }
        });
        const url = res.data?.results?.[0]?.url;
        if (url && url.startsWith('http')) return url;
    } catch (e) {
        console.warn(`[social] v2 falló para ${endpoint}:`, e.message);
    }

    // Intento 2: API v1 como fallback
    try {
        const res = await axios.get(`https://nekos.life/api/v2/img/${endpoint}`, {
            timeout: 6000,
            headers: { 'Accept': 'application/json' }
        });
        const url = res.data?.url;
        if (url && url.startsWith('http')) return url;
    } catch (e) {
        console.warn(`[social] v1 falló para ${endpoint}:`, e.message);
    }

    return null; // Sin GIF disponible
}

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Builder dinámico ───────────────────────────────────────────────────────────
const builder = new SlashCommandBuilder()
    .setName('social')
    .setDescription('🎭 Comandos sociales y de roleplay');

for (const [nombre, cfg] of Object.entries(ACCIONES)) {
    if (cfg.tipo === 'solo') {
        builder.addSubcommand(s =>
            s.setName(nombre).setDescription(`${cfg.emoji} ${nombre}`)
        );
    } else {
        builder.addSubcommand(s =>
            s.setName(nombre).setDescription(`${cfg.emoji} ${nombre} a alguien`)
             .addUserOption(o => o.setName('usuario').setDescription('¿A quién?').setRequired(true))
        );
    }
}

// ─── Módulo ─────────────────────────────────────────────────────────────────────
module.exports = {
    data: builder,
    ACCIONES, getGif, rand,

    async execute(interaction) {
        await interaction.deferReply();

        const sub     = interaction.options.getSubcommand();
        const userB   = interaction.options.getUser('usuario') ?? null;
        const embed   = await this.generarEmbed(interaction.user, userB, sub);

        const row = userB
            ? new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`soc_ret_${sub}_${interaction.user.id}`)
                    .setLabel('↩️ Devolver')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`soc_rej_${interaction.user.id}`)
                    .setLabel('❌ Rechazar')
                    .setStyle(ButtonStyle.Danger)
              )
            : null;

        await interaction.editReply({
            embeds: [embed],
            components: row ? [row] : []
        });
    },

    async generarEmbed(userA, userB, sub) {
        const cfg = ACCIONES[sub];
        const gif = await getGif(cfg.endpoint);

        const frase = rand(cfg.frases)
            .replace(/{a}/g, `**${userA.username}**`)
            .replace(/{b}/g, userB ? `**${userB.username}**` : '');

        const embed = new EmbedBuilder()
            .setColor(cfg.color)
            .setDescription(`${cfg.emoji} ${frase}`)
            .setAuthor({
                name: userB ? `${userA.username} → ${userB.username}` : userA.username,
                iconURL: userA.displayAvatarURL({ dynamic: true })
            })
            .setFooter({ text: 'Kripton Social • nekos.best' })
            .setTimestamp();

        // Solo agrega imagen si la URL es válida
        if (gif) {
            embed.setImage(gif);
        } else {
            embed.setFooter({ text: 'Kripton Social • (GIF no disponible momentáneamente)' });
        }

        return embed;
    }
};