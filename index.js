require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot online!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor web iniciado en el puerto ${PORT}`);
});
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');

// Agregamos intents mínimos necesarios para interacciones
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});
client.commands = new Collection();
const commandsArray = [];

console.log("--- Iniciando Kripton Bot ---");

const foldersPath = path.join(__dirname, 'commands');
if (!fs.existsSync(foldersPath)) {
    console.error("❌ ERROR: No encuentro la carpeta 'commands'.");
    process.exit();
}

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (fs.lstatSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
                console.log(`   ✅ Comando cargado: /${command.data.name}`);
            }
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsArray });
        console.log('✅ Comandos registrados con éxito.');
    } catch (error) { console.error("❌ Error en registro:", error); }
})();

// --- MANEJO DE COMANDOS Y BOTONES ---
client.on('interactionCreate', async interaction => {
    // 1. Manejo de Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); } 
        catch (e) { console.error(e); await interaction.reply({ content: '❌ Error.', ephemeral: true }); }
    } 
    // 2. Manejo de Botones (Rechazar/Devolver)
    else if (interaction.isButton()) {
        const [prefijo, tipo, sub, originalId] = interaction.customId.split('_');
        if (prefijo !== 'soc') return;

        if (tipo === 'rej') { // RECHAZAR
            await interaction.update({ content: `❌ Interacción rechazada por **${interaction.user.username}**`, embeds: [], components: [] });
        } else if (tipo === 'ret') { // DEVOLVER
            const command = client.commands.get('social');
            const originalUser = await client.users.fetch(originalId);
            
            // Generamos el embed invertido
            const nuevoEmbed = await command.generarEmbed(interaction.user, originalUser, sub);
            
            await interaction.reply({ content: `🔄 **${interaction.user.username}** le devolvió el gesto a <@${originalId}>!`, embeds: [nuevoEmbed] });
            await interaction.message.edit({ components: [] }); // Quitamos botones del anterior
        }
    }
});

client.once('ready', () => console.log(`🚀 ${client.user.tag} EN LÍNEA`));
// --- CONFIGURACIÓN: ID DE CANALES ---
const BIENVENIDA_CHANNEL_ID = '1492936706524188803'; // Cambia por tu ID
const DESPEDIDA_CHANNEL_ID = '1492936706524188804';   // Cambia por tu ID

// --- BIENVENIDA ---
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(BIENVENIDA_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('👋 ¡Bienvenido al servidor!')
        .setColor('#00FF00')
        .setDescription(`¡Hola ${member.user}! Esperamos que la pases genial en **${member.guild.name}**.\nYa somos ${member.guild.memberCount} miembros.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

    channel.send({ embeds: [embed] });
});

// --- DESPEDIDA ---
client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.cache.get(DESPEDIDA_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('😢 Alguien se ha ido')
        .setColor('#FF0000')
        .setDescription(`**${member.user.tag}** ha abandonado el servidor.`)
        .setTimestamp();

    channel.send({ embeds: [embed] });
});
client.login(process.env.DISCORD_TOKEN).catch(e => console.error("❌ Error de Token:", e));