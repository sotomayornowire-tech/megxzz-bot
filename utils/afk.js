// utils/afk.js
const afkUsuarios = new Map(); // userId -> { motivo, desde }

function tiempoTranscurrido(desde) {
    const seg = Math.floor((Date.now() - desde) / 1000);
    if (seg < 60)    return `${seg} segundos`;
    if (seg < 3600)  return `${Math.floor(seg / 60)} minutos`;
    if (seg < 86400) return `${Math.floor(seg / 3600)} horas`;
    return `${Math.floor(seg / 86400)} días`;
}

async function manejarAfk(message) {
    if (message.author.bot) return;

    const contenido = message.content.trim();
    const autorId   = message.author.id;

    // 1. ACTIVAR — "kr afk", "kripton afk", "kr afk [motivo]"
    const matchActivar = contenido.match(/^(kr|kripton)\s+afk(?:\s+(.+))?$/i);
    if (matchActivar) {
        const motivo = matchActivar[2]?.trim() || 'Sin motivo';
        afkUsuarios.set(autorId, { motivo, desde: Date.now() });
        message.delete().catch(() => {});
        return message.channel.send(
            `**${message.author.username}** está AFK.\n\n` +
            `_${motivo}_`
        );
    }

    // 2. VOLVER — el usuario AFK escribe cualquier cosa
    if (afkUsuarios.has(autorId)) {
        const { motivo, desde } = afkUsuarios.get(autorId);
        afkUsuarios.delete(autorId);
        return message.reply(
            `**${message.author.username}**, bienvenido de vuelta.\n\n` +
            `Estuviste AFK por **${tiempoTranscurrido(desde)}** — _${motivo}_`
        );
    }

    // 3. MENCIONES — avisa si alguien mencionado está AFK
    for (const [, usuario] of message.mentions.users) {
        if (!afkUsuarios.has(usuario.id)) continue;
        const { motivo, desde } = afkUsuarios.get(usuario.id);
        message.reply(
            `**${usuario.username}** está AFK.\n\n` +
            `_${motivo}_ — hace **${tiempoTranscurrido(desde)}**`
        );
    }
}

module.exports = { manejarAfk };
