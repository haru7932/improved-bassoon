// ================================================
// commands/owner/license.js — Sistema de licenças (somente owner)
// ================================================
const { SlashCommandBuilder } = require('discord.js');
const { getLicenses, setLicenses, hasValidLicense } = require('../../utils/database');
const { successEmbed, errorEmbed, primaryEmbed } = require('../../utils/embedBuilder');
const { checkOwner } = require('../../utils/permissions');
const { emojis } = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('license')
    .setDescription('🔒 Gerencia licenças de servidores (apenas owner do bot)')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona ou renova licença de um servidor')
        .addStringOption(o => o.setName('guild_id').setDescription('ID do servidor').setRequired(true))
        .addStringOption(o =>
          o.setName('tipo')
            .setDescription('Tipo de licença')
            .setRequired(true)
            .addChoices(
              { name: '📅 Mensal (30 dias)', value: 'mensal' },
              { name: '♾️ Permanente', value: 'permanente' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a licença de um servidor')
        .addStringOption(o => o.setName('guild_id').setDescription('ID do servidor').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Verifica o status da licença de um servidor')
        .addStringOption(o => o.setName('guild_id').setDescription('ID do servidor (deixe vazio para este servidor)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('listar')
        .setDescription('Lista todas as licenças ativas')
    ),

  async execute(interaction) {
    if (!checkOwner(interaction)) return;

    const sub = interaction.options.getSubcommand();

    // ─── Adicionar licença ────────────────────────────────────
    if (sub === 'add') {
      const guildId = interaction.options.getString('guild_id');
      const tipo = interaction.options.getString('tipo');
      const licenses = getLicenses();

      let expiresAt = null;
      if (tipo === 'mensal') {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        expiresAt = date.toISOString();
      }

      licenses[guildId] = {
        guildId,
        type: tipo,
        expiresAt,
        addedAt: new Date().toISOString(),
        addedBy: interaction.user.id,
      };
      setLicenses(licenses);

      return interaction.reply({
        embeds: [successEmbed('Licença Adicionada', [
          `> **Servidor:** \`${guildId}\``,
          `> **Tipo:** ${tipo === 'permanente' ? '♾️ Permanente' : '📅 Mensal'}`,
          `> **Expira em:** ${expiresAt ? `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:F>` : 'Nunca'}`,
        ].join('\n'))],
        ephemeral: true,
      });
    }

    // ─── Remover licença ──────────────────────────────────────
    if (sub === 'remove') {
      const guildId = interaction.options.getString('guild_id');
      const licenses = getLicenses();

      if (!licenses[guildId]) {
        return interaction.reply({ embeds: [errorEmbed('Não encontrado', `> Servidor \`${guildId}\` não possui licença.`)], ephemeral: true });
      }

      delete licenses[guildId];
      setLicenses(licenses);

      return interaction.reply({ embeds: [successEmbed('Licença Removida', `> Licença do servidor \`${guildId}\` foi removida.`)], ephemeral: true });
    }

    // ─── Status de licença ────────────────────────────────────
    if (sub === 'status') {
      const guildId = interaction.options.getString('guild_id') || interaction.guildId;
      const licenses = getLicenses();
      const lic = licenses[guildId];
      const valid = hasValidLicense(guildId);

      if (!lic) {
        return interaction.reply({ embeds: [errorEmbed('Sem Licença', `> Servidor \`${guildId}\` não possui licença.`)], ephemeral: true });
      }

      return interaction.reply({
        embeds: [primaryEmbed(`${emojis.lock} Licença — ${guildId}`, [
          `> **Tipo:** ${lic.type === 'permanente' ? '♾️ Permanente' : '📅 Mensal'}`,
          `> **Status:** ${valid ? `${emojis.success} Ativa` : `${emojis.error} Expirada`}`,
          `> **Expira em:** ${lic.expiresAt ? `<t:${Math.floor(new Date(lic.expiresAt).getTime() / 1000)}:F>` : 'Nunca'}`,
          `> **Adicionada em:** <t:${Math.floor(new Date(lic.addedAt).getTime() / 1000)}:D>`,
        ].join('\n'))],
        ephemeral: true,
      });
    }

    // ─── Listar todas as licenças ─────────────────────────────
    if (sub === 'listar') {
      const licenses = getLicenses();
      const entries = Object.values(licenses);

      if (entries.length === 0) {
        return interaction.reply({ embeds: [primaryEmbed(`${emojis.lock} Licenças`, '> Nenhuma licença registrada.')], ephemeral: true });
      }

      const description = entries.map(lic => {
        const valid = hasValidLicense(lic.guildId);
        const expiry = lic.expiresAt ? `<t:${Math.floor(new Date(lic.expiresAt).getTime() / 1000)}:R>` : 'Nunca';
        return `> ${valid ? emojis.success : emojis.error} \`${lic.guildId}\` — **${lic.type}** | Expira: ${expiry}`;
      }).join('\n');

      return interaction.reply({
        embeds: [primaryEmbed(`${emojis.lock} Licenças Ativas (${entries.length})`, description)],
        ephemeral: true,
      });
    }
  },
};
