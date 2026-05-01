require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const app = express();
const { manejarAfk } = require('./utils/afk');

// Servidor para Render
app.get('/', (req, res) => res.send('Bot online!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor web iniciado en el puerto ${PORT}`);
});

const { 
    Client, Collection, GatewayIntentBits, 
    Partials, REST, Routes, EmbedBuilder 
} = require('discord.js');

const { agregarTexto, obtenerCola } = require('./utils/tts');
const { manejarBotonTicket }        = require('./commands/utilidad/ticket');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.GuildMember, Partials.Message, Partials.Channel]
});

client.commands = new Collection();
const commandsArray = [];

console.log("--- Iniciando Kripton Bot ---");

// Carga de comandos
const foldersPath = path.join(__dirname, 'commands');
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
                console.log(`    ✅ Comando cargado: /${command.data.name}`);
            }
        }
    }
}

// Registro de Slash Commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsArray });
        console.log('✅ Comandos registrados con éxito.');
    } catch (error) { 
        console.error("❌ Error en registro:", error); 
    }
})();

// --- MANEJO DE INTERACCIONES ---
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { 
            await command.execute(interaction); 
        } catch (e) { 
            console.error(e); 
            await interaction.reply({ content: '❌ Error al ejecutar el comando.', flags: 64 });
        }
    } 
    else if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            return manejarBotonTicket(interaction);
        }

        const [prefijo, tipo, sub, originalId, targetId] = interaction.customId.split('_');
        if (prefijo !== 'soc') return;

        if (interaction.user.id !== targetId) {
            return interaction.reply({ 
                content: '❌Este botón no es para vos. Solo la persona que recibió la acción puede usarlo.', 
                flags: 64 
            });
        }

        if (tipo === 'rej') {
            await interaction.update({ content: `❌ **${interaction.user.username}** rechazó la interacción.`, embeds: [], components: [] });
        } else if (tipo === 'ret') {
            const command = client.commands.get('social');
            const userA = interaction.user;
            const userB = await client.users.fetch(originalId); 
            
            const nuevoEmbed = await command.generarEmbed(userA, userB, sub);
            await interaction.reply({ content: `🔄 ¡Gesto devuelto!`, embeds: [nuevoEmbed] });
            await interaction.message.edit({ components: [] });
        }
    }
});

// --- CONSTANTES DE CANALES ---
const BIENVENIDA_CHANNEL_ID = '1496695262243197039';
const DESPEDIDA_CHANNEL_ID  = '1492936706524188804';
const LOGS_CHANNEL_ID       = '1499828573261922406';

// --- EVENTO: ENTRADA DE MIEMBROS (SEGURIDAD + BIENVENIDA) ---
client.on('guildMemberAdd', async member => {

            const logChannel = member.guild.channels.cache.get(LOGS_CHANNEL_ID);
            if (logChannel) {
                logChannel.send(`🛡️ **Sistema Anti-Spam:** Se ha baneado a \`${member.user.tag}\``);
            }
            return; // Detener ejecución para que no le dé la bienvenida
        } catch (err) {
            console.error("Error al ejecutar auto-ban:", err);
        }
    }

    // Lógica normal de autorol
    if (AUTOROL_ID) {
        member.roles.add(AUTOROL_ID).catch(err => console.error("Error al dar autorol:", err));
    }

    // Mensaje de bienvenida
    const channel = member.guild.channels.cache.get(BIENVENIDA_CHANNEL_ID);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
        .setTitle('👋 ¡Bienvenido!')
        .setColor('#00FF00')
        .setDescription(`¡Hola ${member.user}! Bienvenido a **${member.guild.name}**.`)
        .setTimestamp();
    channel.send({ embeds: [embed] });
});

client.on('guildMemberRemove', async member => {
    const channel = member.guild.channels.cache.get(DESPEDIDA_CHANNEL_ID);
    if (channel) {
        channel.send(`😢 **${member.user.tag}** ha abandonado el servidor.`);
    }
    try {
        await member.send(`😢 Hola ${member.user.username}, lamentamos que hayas decidido dejar **${member.guild.name}**. ¡Esperamos volver a verte pronto!`);
    } catch (err) {
        console.log(`No pude enviar DM a ${member.user.tag}.`);
    }
});

// --- LOGS DE MENSAJES ---
client.on('messageUpdate', (oldMsg, newMsg) => {
    if (oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
    const logChannel = newMsg.guild?.channels.cache.get(LOGS_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('✏️ Mensaje Editado')
        .setColor('#FFA500')
        .addFields(
            { name: 'Usuario', value: `${newMsg.author.tag}`, inline: true },
            { name: 'Canal', value: `${newMsg.channel.name}`, inline: true },
            { name: 'Antes', value: oldMsg.content || '*Contenido no disponible*' },
            { name: 'Ahora', value: newMsg.content || '*Contenido no disponible*' }
        );
    logChannel.send({ embeds: [embed] });
});

client.on('messageDelete', (message) => {
    if (message.author?.bot) return;
    const logChannel = message.guild?.channels.cache.get(LOGS_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🗑️ Mensaje Borrado')
        .setColor('#FF0000')
        .setDescription(`Mensaje de ${message.author.tag} borrado en ${message.channel}`)
        .addFields({ name: 'Contenido', value: message.content || '*Contenido no disponible*' });
    logChannel.send({ embeds: [embed] });
});

// --- EVENTOS DE MENSAJE (AFK, TTS, IA) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.guild) {
        const cola = obtenerCola(message.guild.id);
        if (cola && cola.activo && message.channel.id === cola.canalTextoId) {
            agregarTexto(message.guild.id, message.content);
        }
    }

    }
});


client.once('ready', () => console.log(`🚀 ${client.user.tag} EN LÍNEA`));

client.login(process.env.DISCORD_TOKEN);
