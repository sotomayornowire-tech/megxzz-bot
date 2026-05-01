const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function manejarBotonTicket(interaction) {
    // 1. Lógica para ABRIR ticket
    if (interaction.customId === 'ticket_open') {
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Cerrar Ticket')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: `✅ Ticket creado: ${channel}`, ephemeral: true });
        await channel.send({ content: `Hola ${interaction.user}, en breve te atenderá el staff.`, components: [row] });
    }

    // 2. Lógica para CERRAR ticket
    if (interaction.customId === 'ticket_close') {
        await interaction.reply('El ticket se cerrará en 5 segundos...');
        setTimeout(() => {
            interaction.channel.delete();
        }, 5000);
    }
}

module.exports = { manejarBotonTicket };
