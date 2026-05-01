const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Banea por IP, borra todos los mensajes recientes y desbanea al usuario.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario al que quieres aplicar el softban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('razon')
                .setDescription('La razón del softban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // Solo gente con permiso de baneo puede usarlo

    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'Softban: Limpieza de mensajes y expulsión.';
        const guild = interaction.guild;

        try {
            // 1. BANEO POR IP Y LIMPIEZA DE MENSAJES
            // deleteMessageSeconds: 604800 son 7 días (el máximo que permite Discord)
            await guild.members.ban(user, { 
                deleteMessageSeconds: 604800, 
                reason: reason 
            });

            // 2. DESBANEO INMEDIATO
            // Esto quita el baneo de IP para que el usuario pueda volver a entrar si quiere
            await guild.members.unban(user.id, 'Softban completado (desbaneo automático)');

            await interaction.reply({ 
                content: `🧼 **Softban exitoso**\n**Usuario:** ${user.tag}\n**Acción:** Se borraron sus mensajes de los últimos 7 días y fue expulsado del servidor.`,
                ephemeral: false 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ No pude aplicar el softban. Asegúrate de que mi rol esté por encima del usuario y que tenga permisos de "Banear Miembros".', 
                ephemeral: true 
            });
        }
    },
};
