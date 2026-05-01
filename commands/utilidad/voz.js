const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voz')
        .setDescription('Cambia el género de la voz del bot.')
        .addStringOption(option =>
            option.setName('genero')
                .setDescription('Elige el género de la voz')
                .setRequired(true)
                .addChoices(
                    { name: 'Mujer', value: 'mujer' },
                    { name: 'Hombre', value: 'hombre' }
                )),

    async execute(interaction) {
        const genero = interaction.options.getString('genero');

        // Aquí guardas la preferencia. 
        // Si usas una base de datos, guárdalo ahí. 
        // Si no, puedes usar una variable global en tu index.js o un archivo JSON.
        // Ejemplo simple para este caso:
        process.env.VOZ_PREFERIDA = genero; 

        await interaction.reply({ 
            content: `✅ He configurado la voz a: **${genero}**.`, 
            ephemeral: true 
        });
    },
};
