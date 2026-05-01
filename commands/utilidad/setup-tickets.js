const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Configura el panel para el sistema de tickets de soporte.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo administradores pueden usarlo

    async execute(interaction) {
        // --- DISEÑO ESTÉTICO DEL PANEL ---
        const embed = new EmbedBuilder()
            .setColor('#5865F2') // Color Blurple de Discord (puedes cambiarlo por otro hexadecimal)
            .setTitle('📩 Centro de Soporte Kripton')
            .setThumbnail(interaction.client.user.displayAvatarURL()) // Pone el avatar de tu bot en la esquina
            .setDescription(
                '¿Necesitas ayuda con algo o tienes alguna duda?\n\n' +
                'Presiona el botón de abajo para abrir un ticket de atención personalizada. ' +
                'Nuestros moderadores te atenderán en breve.'
            )
            .addFields(
                { name: '⏰ Horario de Atención', value: '24/7 (Sujeto a disponibilidad del Staff)', inline: true },
                { name: '✅ Recordatorio', value: 'Usa esta función de forma responsable.', inline: true }
            )
            .setFooter({ text: 'Kripton Development • Sistema de Tickets Simple' });

        // --- CREACIÓN DEL BOTÓN ---
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_open') // ESTE ID ES CRÍTICO. Debe coincidir con lo que tienes en tu index.js
                    .setLabel('Abrir Ticket de Soporte')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Primary), // Botón azul
            );

        // --- ENVÍO DE LOS MENSAJES ---
        // Respondimos a la interacción (solo lo ve el admin)
        await interaction.reply({ content: '✅ Panel de tickets enviado correctamente al canal.', ephemeral: true });

        // Enviamos el panel real al canal
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};
