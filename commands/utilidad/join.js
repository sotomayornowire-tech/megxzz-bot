const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { crearCola, obtenerCola } = require('../../utils/tts');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Me uno a tu canal de voz y leo los mensajes'),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ 
                content: '_Primero unite a un canal de voz._', 
                ephemeral: true 
            });
        }

        const colaExistente = obtenerCola(interaction.guild.id);
        if (colaExistente) {
            return interaction.reply({ 
                content: '_Ya estoy en un canal de voz. Usá `/leave` primero._', 
                ephemeral: true 
            });
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId:   interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        crearCola(interaction.guild.id, connection, interaction.channel.id);

        await interaction.reply(
            `Me uní a **${voiceChannel.name}** y voy a leer los mensajes de este canal.`
        );
    }
};
