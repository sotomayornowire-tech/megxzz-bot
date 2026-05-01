const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// ─── Colores temáticos rotatorios ───────────────────────────────────────────────
const COLORES = ['#FF85A1','#A29BFE','#74B9FF','#55EFC4','#FDCB6E','#FD79A8','#00CEC9'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];


async function getNekoGif() {

    const opciones = ['think', 'smile', 'wave', 'nod'];
    for (const ep of opciones) {
        try {
            const res = await axios.get(`https://nekos.best/api/v2/${ep}`, {
                timeout: 5000,
                headers: { 'Accept': 'application/json' }
            });
            const url = res.data?.results?.[0]?.url;
            if (url && url.startsWith('http')) return url;
        } catch { /* siguiente */ }
    }
    return null;
}

// ─── Llamada a Claude (Anthropic) ───────────────────────────────────────────────
async function preguntarIA(pregunta) {
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-AR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const horaStr = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const systemPrompt = `
Sos Kripton, el asistente del servidor de Discord. Respondés en español rioplatense, de forma casual y directa, como si hablaras con un amigo del servidor.

Reglas IMPORTANTES:
- Nunca uses bullet points, listas con guiones, ni encabezados en negrita tipo "**Características:**".
- Respondé en 2 o 3 oraciones máximo, siendo conciso y natural.
- Si la respuesta necesita más detalle, podés ir hasta 5 oraciones, pero nunca más.
- No arranques con "¡Hola!" ni cierres con "¿Hay algo más en que pueda ayudarte?". Respondé directo.
- Podés usar humor si la pregunta lo permite.
- Si alguien pregunta la fecha, la hora, o "qué día es mañana", usá estos datos: Hoy es ${fechaStr}, son las ${horaStr} (Argentina, UTC-3).
- No inventes información que no tenés segura; si no sabés algo, decilo directamente.
`.trim();

    const res = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
            model: 'claude-opus-4-5',
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: 'user', content: pregunta }]
        },
        {
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    return res.data?.content?.[0]?.text?.trim() ?? '...no sé qué decirte jaja';
}

// ─── Comando ─────────────────────────────────────────────────────────────────────
module.exports = {
    data: new SlashCommandBuilder()
        .setName('kr')
        .setDescription('🤖 Comandos de Kripton')
        .addSubcommand(sub =>
            sub.setName('duda')
               .setDescription('🧠 Hacele una pregunta a Kripton')
               .addStringOption(opt =>
                   opt.setName('pregunta')
                      .setDescription('¿Qué querés saber?')
                      .setRequired(true)
               )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const pregunta = interaction.options.getString('pregunta');

        // Buscar GIF y respuesta en paralelo para ir más rápido
        const [respuesta, gif] = await Promise.allSettled([
            preguntarIA(pregunta),
            getNekoGif()
        ]);

        const texto = respuesta.status === 'fulfilled'
            ? respuesta.value
            : '¡Uy, algo salió mal! Intentá de nuevo en un momento.';

        const gifUrl = gif.status === 'fulfilled' ? gif.value : null;
        const color  = rand(COLORES);

        // ─── Embed estilo neko.ask ───────────────────────────────────────────────
        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({
                name: `${interaction.user.username} preguntó...`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(
                `**❓ ${pregunta}**\n\n` +
                `🤖 ${texto}`
            )
            .setFooter({ text: 'Kripton • Asistente del servidor' })
            .setTimestamp();

        if (gifUrl) embed.setThumbnail(gifUrl);

        await interaction.editReply({ embeds: [embed] });
    }
};