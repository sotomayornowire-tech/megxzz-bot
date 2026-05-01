const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { leer, guardar } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('⚙️ Configura el sistema de seguridad avanzado (Estilo RB3 Guard)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    
    // 1. Ver Configuración
    .addSubcommand(s => s
      .setName('ver')
      .setDescription('Ver el panel completo de seguridad actual')
    )
    
    // 2. Canal de Logs
    .addSubcommand(s => s
      .setName('logs')
      .setDescription('Configura el canal donde se enviarán las alertas de seguridad')
      .addChannelOption(o => o.setName('canal')
        .setDescription('Canal de texto para auditoría')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    )

    // 3. Anti-Spam / Flood
    .addSubcommand(s => s
      .setName('antispam')
      .setDescription('Configura el Anti-Spam y Anti-Flood')
      .addIntegerOption(o => o.setName('mensajes').setDescription('Mensajes máximos').setRequired(true).setMinValue(3).setMaxValue(20))
      .addIntegerOption(o => o.setName('segundos').setDescription('Ventana de tiempo en segundos').setRequired(true).setMinValue(2).setMaxValue(30))
      .addIntegerOption(o => o.setName('timeout').setDescription('Minutos de castigo (Mute)').setRequired(true).setMinValue(1).setMaxValue(60))
    )

    // 4. Anti-Raid
    .addSubcommand(s => s
      .setName('antiraid')
      .setDescription('Configura el Anti-Raid (Entradas masivas en poco tiempo)')
      .addIntegerOption(o => o.setName('entradas').setDescription('Límite de usuarios entrando').setRequired(true).setMinValue(3).setMaxValue(30))
      .addIntegerOption(o => o.setName('segundos').setDescription('En cuántos segundos').setRequired(true).setMinValue(5).setMaxValue(60))
      .addStringOption(o => o.setName('castigo').setDescription('Qué hacer con los raiders').setRequired(true)
        .addChoices(
            { name: 'Banear a todos', value: 'ban' },
            { name: 'Expulsar (Kick)', value: 'kick' }
        ))
    )

    // 5. Anti-Nuke (Modo RB3: Incluye DEMOTE)
    .addSubcommand(s => s
      .setName('antinuke')
      .setDescription('Anti-Nuke contra admins corruptos (Borrado de canales, baneos masivos)')
      .addIntegerOption(o => o.setName('limite').setDescription('Límite de acciones destructivas').setRequired(true).setMinValue(1).setMaxValue(10))
      .addStringOption(o => o.setName('castigo').setDescription('Castigo al atacante').setRequired(true)
        .addChoices(
            { name: '🔴 Demote (Quitarle todos los roles) [RECOMENDADO]', value: 'demote' },
            { name: '🔨 Banearlo permanentemente', value: 'ban' },
            { name: '👢 Expulsarlo (Kick)', value: 'kick' }
        ))
    )

    // 6. Anti-Bot
    .addSubcommand(s => s
      .setName('antibot')
      .setDescription('Evita que usuarios inviten a otros bots maliciosos al servidor')
      .addBooleanOption(o => o.setName('activar').setDescription('¿Activar auto-ban/kick a bots no autorizados?').setRequired(true))
    )

    // 7. Anti-Alts (Cuentas nuevas)
    .addSubcommand(s => s
      .setName('antialts')
      .setDescription('Protección contra cuentas recién creadas')
      .addIntegerOption(o => o.setName('dias').setDescription('Días mínimos de creación para entrar (0 para desactivar)').setRequired(true).setMinValue(0).setMaxValue(60))
    )

    // 8. Anti-Maliciosos (Global Blacklist)
    .addSubcommand(s => s
      .setName('antimaliciosos')
      .setDescription('Banea automáticamente a usuarios en listas negras globales de raiders')
      .addBooleanOption(o => o.setName('activar').setDescription('¿Activar filtro global?').setRequired(true))
    )

    // 9. Anti-Publicidad
    .addSubcommand(s => s
      .setName('antipublicidad')
      .setDescription('Bloquear links e invitaciones a otros servidores')
      .addBooleanOption(o => o.setName('activar').setDescription('¿Activar filtro anti-links?').setRequired(true))
    )

    // 10. Whitelist / Roles Exentos
    .addSubcommand(s => s
      .setName('whitelist')
      .setDescription('Añade o remueve un rol exento (Ignora TODA la seguridad)')
      .addRoleOption(o => o.setName('rol').setDescription('Rol del Staff a eximir/remover').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    
    // 🗄️ Cargar BD y asegurar la estructura completa
    let cfg = leer('config.json') || {};
    if (!cfg.canalLogs) cfg.canalLogs = null;
    if (!cfg.antispam) cfg.antispam = { mensajes: 5, segundos: 5, timeoutMin: 5 };
    if (!cfg.antiraid) cfg.antiraid = { entradas: 5, segundos: 10, castigo: 'kick' };
    if (!cfg.antinuke) cfg.antinuke = { limite: 3, castigo: 'demote' };
    if (cfg.antibot === undefined) cfg.antibot = false;
    if (cfg.antiAltsDias === undefined) cfg.antiAltsDias = 0;
    if (cfg.antiMaliciosos === undefined) cfg.antiMaliciosos = false;
    if (cfg.antipublicidad === undefined) cfg.antipublicidad = true;
    if (!cfg.whitelist) cfg.whitelist = [];

    // 📊 PANEL PRINCIPAL (VER)
    if (sub === 'ver') {
      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('🛡️ Panel de Seguridad RB3 Guard Mode')
        .setDescription(`**Canal de Logs:** ${cfg.canalLogs ? `<#${cfg.canalLogs}>` : '`No configurado`'}`)
        .addFields(
          {
            name: '💬 Anti-Spam',
            value: `**Límite:** \`${cfg.antispam.mensajes}\` msjs en \`${cfg.antispam.segundos}s\`\n**Castigo:** \`${cfg.antispam.timeoutMin}m timeout\``,
            inline: true
          },
          {
            name: '🚨 Anti-Raid',
            value: `**Límite:** \`${cfg.antiraid.entradas}\` usuarios en \`${cfg.antiraid.segundos}s\`\n**Castigo:** \`${cfg.antiraid.castigo.toUpperCase()}\``,
            inline: true
          },
          {
            name: '☢️ Anti-Nuke',
            value: `**Límite:** \`${cfg.antinuke.limite}\` acciones destructivas\n**Castigo:** \`${cfg.antinuke.castigo.toUpperCase()}\``,
            inline: true
          },
          {
            name: '🤖 Anti-Bot',
            value: cfg.antibot ? '🟢 `Activado`' : '🔴 `Desactivado`',
            inline: true
          },
          {
            name: '👤 Anti-Alts',
            value: cfg.antiAltsDias > 0 ? `🟢 \`Min. ${cfg.antiAltsDias} días\`` : '🔴 `Desactivado`',
            inline: true
          },
          {
            name: '☠️ Anti-Maliciosos',
            value: cfg.antiMaliciosos ? '🟢 `Activado`' : '🔴 `Desactivado`',
            inline: true
          },
          {
            name: '🔗 Anti-Publicidad',
            value: cfg.antipublicidad ? '🟢 `Activado`' : '🔴 `Desactivado`',
            inline: true
          },
          {
            name: '⭐ Whitelist (Inmunes)',
            value: cfg.whitelist.length ? cfg.whitelist.map(id => `<@&${id}>`).join(', ') : '`Nadie`',
            inline: true
          }
        )
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Seguridad gestionada por ${interaction.client.user.username}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 🔄 LÓGICA DE GUARDADO DE SUBCOMANDOS
    if (sub === 'logs') {
      const canal = interaction.options.getChannel('canal');
      cfg.canalLogs = canal.id;
      guardar('config.json', cfg);
      return interaction.reply({ embeds: [crearExito(`✅ Canal de Logs establecido en ${canal}`)] });
    }

    if (sub === 'antispam') {
      cfg.antispam = {
        mensajes: interaction.options.getInteger('mensajes'),
        segundos: interaction.options.getInteger('segundos'),
        timeoutMin: interaction.options.getInteger('timeout'),
      };
      guardar('config.json', cfg);
      return interaction.reply({ embeds: [crearExito(`✅ Anti-Spam: **${cfg.antispam.mensajes}** msjs cada **${cfg.antispam.segundos}s** → Timeout de **${cfg.antispam.timeoutMin}m**.`)] });
    }

    if (sub === 'antiraid') {
      cfg.antiraid = {
        entradas: interaction.options.getInteger('entradas'),
        segundos: interaction.options.getInteger('segundos'),
        castigo: interaction.options.getString('castigo')
      };
      guardar('config.json', cfg);
      return interaction.reply({ embeds: [crearExito(`✅ Anti-Raid: **${cfg.antiraid.entradas}** entradas cada **${cfg.antiraid.segundos}s** → **${cfg.antiraid.castigo.toUpperCase()}**.`)] });
    }

    if (sub === 'antinuke') {
        cfg.antinuke = {
          limite: interaction.options.getInteger('limite'),
          castigo: interaction.options.getString('castigo')
        };
        guardar('config.json', cfg);
        return interaction.reply({ embeds: [crearExito(`☢️ Anti-Nuke: Límite de **${cfg.antinuke.limite}** acciones destructivas → **${cfg.antinuke.castigo.toUpperCase()}**.`)] });
    }

    if (sub === 'antibot') {
      cfg.antibot = interaction.options.getBoolean('activar');
      guardar('config.json', cfg);
      return interaction.reply({ embeds: [crearExito(`🤖 Anti-Bot ${cfg.antibot ? '**ACTIVADO** (Bots expulsados automáticamente)' : '**DESACTIVADO**'}.`)] });
    }

    if (sub === 'antialts') {
        cfg.antiAltsDias = interaction.options.getInteger('dias');
        guardar('config.json', cfg);
        const estado = cfg.antiAltsDias > 0 ? `**ACTIVADO** (Mínimo ${cfg.antiAltsDias} días de creación)` : '**DESACTIVADO**';
        return interaction.reply({ embeds: [crearExito(`👤 Anti-Alts ${estado}.`)] });
    }

    if (sub === 'antimaliciosos') {
        cfg.antiMaliciosos = interaction.options.getBoolean('activar');
        guardar('config.json', cfg);
        return interaction.reply({ embeds: [crearExito(`☠️ Filtro Global Anti-Maliciosos ${cfg.antiMaliciosos ? '**ACTIVADO**' : '**DESACTIVADO**'}.`)] });
    }

    if (sub === 'antipublicidad') {
      cfg.antipublicidad = interaction.options.getBoolean('activar');
      guardar('config.json', cfg);
      return interaction.reply({ embeds: [crearExito(`🔗 Anti-Publicidad ${cfg.antipublicidad ? '**ACTIVADO**' : '**DESACTIVADO**'}.`)] });
    }

    if (sub === 'whitelist') {
      const rol = interaction.options.getRole('rol');
      if (cfg.whitelist.includes(rol.id)) {
        cfg.whitelist = cfg.whitelist.filter(id => id !== rol.id);
        guardar('config.json', cfg);
        return interaction.reply({ embeds: [crearExito(`❌ El rol ${rol} **fue removido** de la Whitelist. La seguridad ahora los afectará.`)] });
      } else {
        cfg.whitelist.push(rol.id);
        guardar('config.json', cfg);
        return interaction.reply({ embeds: [crearExito(`⭐ El rol ${rol} **fue añadido** a la Whitelist. Tienen inmunidad a la seguridad.`)] });
      }
    }
  },
};

// Función auxiliar para mantener el código DRY (Don't Repeat Yourself)
function crearExito(texto) {
    return new EmbedBuilder().setColor('#00FF7F').setDescription(texto);
}