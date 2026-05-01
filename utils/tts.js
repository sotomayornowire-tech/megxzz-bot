const { 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    NoSubscriberBehavior 
} = require('@discordjs/voice');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const colas = new Map();

const VOCES = {
    mujer:  'es-AR-ElenaNeural',
    hombre: 'es-AR-TomasNeural',
};

// ─────────────────────────────────────────────
//  OBTENER COLA
// ─────────────────────────────────────────────
function obtenerCola(guildId) {
    return colas.get(guildId) || null;
}

// ─────────────────────────────────────────────
//  CREAR COLA
// ─────────────────────────────────────────────
function crearCola(guildId, connection, canalTextoId) {
    // Si ya existe una cola activa, la destruimos primero
    if (colas.has(guildId)) {
        detenerTTS(guildId);
    }

    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
    });

    const cola = {
        connection,
        player,
        queue:        [],
        activo:       true,
        canalTextoId,
        voz:          'mujer',   // voz por defecto
        reproduciendo: false,
    };

    colas.set(guildId, cola);
    connection.subscribe(player);

    // Cuando termina un audio, pasa al siguiente
    player.on(AudioPlayerStatus.Idle, () => {
        const c = colas.get(guildId);
        if (!c || !c.activo) return;
        c.reproduciendo = false;
        c.queue.shift();
        if (c.queue.length > 0) reproducirSiguiente(guildId);
    });

    player.on('error', err => {
        console.error('[TTS] Error en player:', err.message);
        const c = colas.get(guildId);
        if (!c) return;
        c.reproduciendo = false;
        c.queue.shift();
        if (c.queue.length > 0) reproducirSiguiente(guildId);
    });

    // Si la conexión se cae, limpiamos
    connection.on('error', err => {
        console.error('[TTS] Error en conexión de voz:', err.message);
        detenerTTS(guildId);
    });

    console.log(`[TTS] Cola creada para guild ${guildId}`);
    return cola;
}

// ─────────────────────────────────────────────
//  REPRODUCIR SIGUIENTE EN COLA
// ─────────────────────────────────────────────
async function reproducirSiguiente(guildId) {
    const cola = colas.get(guildId);
    if (!cola || !cola.activo || cola.queue.length === 0 || cola.reproduciendo) return;

    cola.reproduciendo = true;
    const texto     = cola.queue[0];
    const tmpFile   = path.join(os.tmpdir(), `tts_${guildId}_${Date.now()}.mp3`);
    const vozNombre = VOCES[cola.voz] || VOCES.mujer;

    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(vozNombre, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

        await new Promise((resolve, reject) => {
            const { audioStream } = tts.toStream(texto);
            const fileStream = fs.createWriteStream(tmpFile);
            audioStream.pipe(fileStream);
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
            audioStream.on('error', reject);
        });

        const resource = createAudioResource(tmpFile);
        cola.player.play(resource);

        // Borramos el archivo temporal después de que seguro ya se reprodujo
        setTimeout(() => fs.unlink(tmpFile, () => {}), 15000);

    } catch (err) {
        console.error('[TTS] Error al generar audio:', err.message);
        cola.reproduciendo = false;
        cola.queue.shift();
        if (cola.queue.length > 0) reproducirSiguiente(guildId);
    }
}

// ─────────────────────────────────────────────
//  AGREGAR TEXTO A LA COLA
// ─────────────────────────────────────────────
function agregarTexto(guildId, texto) {
    const cola = colas.get(guildId);
    if (!cola || !cola.activo) return false;

    const textoLimpio = texto
        .replace(/<@!?\d+>/g, '')           // menciones de usuario
        .replace(/<#\d+>/g, '')             // menciones de canal
        .replace(/<:\w+:\d+>/g, '')         // emojis personalizados
        .replace(/<a:\w+:\d+>/g, '')        // emojis animados
        .replace(/https?:\/\/\S+/g, 'link') // URLs
        .replace(/[^\w\s\u00C0-\u024F.,!?¿¡]/g, '') // caracteres raros
        .replace(/\s+/g, ' ')               // espacios múltiples
        .trim()
        .slice(0, 200);

    if (!textoLimpio) return false;

    // Evitar mensajes duplicados seguidos
    if (cola.queue.length > 0 && cola.queue[cola.queue.length - 1] === textoLimpio) return false;

    // Límite de cola para evitar spam
    if (cola.queue.length >= 10) {
        console.log(`[TTS] Cola llena para guild ${guildId}, mensaje descartado.`);
        return false;
    }

    cola.queue.push(textoLimpio);
    if (cola.queue.length === 1 && !cola.reproduciendo) reproducirSiguiente(guildId);
    return true;
}

// ─────────────────────────────────────────────
//  CAMBIAR VOZ  ← acá está el fix principal
// ─────────────────────────────────────────────
function cambiarVoz(guildId, voz) {
    const cola = colas.get(guildId);
    if (!cola) return false;
    if (!VOCES[voz]) return false;
    cola.voz = voz;
    console.log(`[TTS] Voz cambiada a "${voz}" en guild ${guildId}`);
    return true;
}

// ─────────────────────────────────────────────
//  DETENER TTS
// ─────────────────────────────────────────────
function detenerTTS(guildId) {
    const cola = colas.get(guildId);
    if (!cola) return false;

    cola.activo       = false;
    cola.reproduciendo = false;
    cola.queue        = [];

    try { cola.player.stop(true); }     catch (_) {}
    try { cola.connection.destroy(); }  catch (_) {}

    colas.delete(guildId);
    console.log(`[TTS] Cola destruida para guild ${guildId}`);
    return true;
}

// ─────────────────────────────────────────────
//  SALTAR MENSAJE ACTUAL
// ─────────────────────────────────────────────
function saltarMensaje(guildId) {
    const cola = colas.get(guildId);
    if (!cola || !cola.activo) return false;
    cola.player.stop(); // dispara AudioPlayerStatus.Idle → pasa al siguiente
    return true;
}

// ─────────────────────────────────────────────
//  INFO DE COLA (útil para un comando /ttsstatus)
// ─────────────────────────────────────────────
function infoCola(guildId) {
    const cola = colas.get(guildId);
    if (!cola) return null;
    return {
        activo:        cola.activo,
        voz:           cola.voz,
        vozNombre:     VOCES[cola.voz],
        mensajesEnCola: cola.queue.length,
        reproduciendo: cola.reproduciendo,
    };
}

module.exports = { 
    obtenerCola, 
    crearCola, 
    agregarTexto, 
    detenerTTS, 
    cambiarVoz, 
    saltarMensaje,
    infoCola,
    VOCES 
};
