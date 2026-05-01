const { createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const gtts = require('node-gtts')('es');
const path = require('path');
const fs = require('fs');
const os = require('os');

const colas = new Map(); // guildId → { connection, player, queue, activo, canalTextoId }

function obtenerCola(guildId) {
  return colas.get(guildId);
}

function crearCola(guildId, connection, canalTextoId) {
  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
  });
  const cola = { connection, player, queue: [], activo: true, canalTextoId };
  colas.set(guildId, cola);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    const c = colas.get(guildId);
    if (!c || !c.activo) return;
    c.queue.shift();
    if (c.queue.length > 0) reproducirSiguiente(guildId);
  });

  player.on('error', err => console.error('TTS player error:', err));
  return cola;
}

function reproducirSiguiente(guildId) {
  const cola = colas.get(guildId);
  if (!cola || cola.queue.length === 0) return;

  const texto = cola.queue[0];
  const tmpFile = path.join(os.tmpdir(), `tts_${guildId}_${Date.now()}.mp3`);

  gtts.save(tmpFile, texto, (err) => {
    if (err) {
      console.error('Error TTS:', err);
      cola.queue.shift();
      if (cola.queue.length > 0) reproducirSiguiente(guildId);
      return;
    }
    const resource = createAudioResource(tmpFile);
    cola.player.play(resource);

    // Limpiar archivo temporal después
    setTimeout(() => fs.unlink(tmpFile, () => {}), 10000);
  });
}

function agregarTexto(guildId, texto) {
  const cola = colas.get(guildId);
  if (!cola || !cola.activo) return false;

  // Limpiar emojis y menciones para TTS
  const textoLimpio = texto
    .replace(/<@!?\d+>/g, '')
    .replace(/<#\d+>/g, '')
    .replace(/<:\w+:\d+>/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/[^\w\s\u00C0-\u024F.,!?¿¡]/g, '')
    .trim()
    .slice(0, 200);

  if (!textoLimpio) return false;

  cola.queue.push(textoLimpio);
  if (cola.queue.length === 1) reproducirSiguiente(guildId);
  return true;
}

function detenerTTS(guildId) {
  const cola = colas.get(guildId);
  if (!cola) return false;
  cola.activo = false;
  cola.queue = [];
  cola.player.stop(true);
  cola.connection.destroy();
  colas.delete(guildId);
  return true;
}

module.exports = { obtenerCola, crearCola, agregarTexto, detenerTTS };