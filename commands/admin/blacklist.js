// ================================================
// commands/admin/blacklist.js — Sistema de blacklist
// ================================================
const { SlashCommandBuilder } = require('discord.js');
const { getBlacklist, setBlacklist } = require('../../utils/database');
const { successEmbed, errorEmbed, primaryEmbed } = require('../../utils/embedBuilder');
const { checkStaff } = require('../../utils/permissions');
const { emojis } = require('../../config/config');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('🚫 Gerencia a blacklist do servidor')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona usuário à blacklist')
        .addUserOption(o => o.setName('usuario').setDescription('Usuário a banir das compras').setRequired(true))
        .addStringOption(o => o.setName('motivo').setDescription('Motivo do banimento').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove usuário da blacklist')
        .addUserOption(o => o.setName('usuario').setDescription('Usuário a remover da blacklist').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('listar')
        .setDescription('Lista todos os usuários na blacklist')
    ),

  async execute(interaction, client) {
    if (!checkStaff(interaction)) return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // ─── Adicionar à blacklist ────────────────────────────────
    if (sub === 'add') {
      const usuario = interaction.options.getUser('usuario');
      const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';

      if (usuario.id === interaction.user.id) {
        return interaction.reply({ embeds: [errorEmbed('Erro', '> Você não pode se adicionar à blacklist.')], ephemeral: true });
      }

      const blacklist = getBlacklist(guildId);
      if (blacklist.includes(usuario.id)) {
        return interaction.reply({ embeds: [errorEmbed('Já Blacklistado', `> ${usuario.tag} já está na blacklist.`)], ephemeral: true });
      }

      blacklist.push(usuario.id);
      setBlacklist(guildId, blacklist);

      await sendLog(client, guildId, 'Blacklist — Adicionado',
        `> **Usuário:** ${usuario.tag} (\`${usuario.id}\`)\n> **Motivo:** ${motivo}\n> **Staff:** ${interaction.user.tag}`,
        interaction.user
      );

      return interaction.reply({
        embeds: [successEmbed('Adicionado à Blacklist', `> **${usuario.tag}** foi adicionado à blacklist.\n> **Motivo:** ${motivo}`)],
        ephemeral: true,
      });
    }

    // ─── Remover da blacklist ─────────────────────────────────
    if (sub === 'remove') {
      const usuario = interaction.options.getUser('usuario');
      const blacklist = getBlacklist(guildId);

      if (!blacklist.includes(usuario.id)) {
        return interaction.reply({ embeds: [errorEmbed('Não encontrado', `> ${usuario.tag} não está na blacklist.`)], ephemeral: true });
      }

      const newList = blacklist.filter(id => id !== usuario.id);
      setBlacklist(guildId, newList);

      await sendLog(client, guildId, 'Blacklist — Removido',
        `> **Usuário:** ${usuario.tag} (\`${usuario.id}\`)\n> **Staff:** ${interaction.user.tag}`,
        interaction.user
      );

      return interaction.reply({
        embeds: [successEmbed('Removido da Blacklist', `> **${usuario.tag}** foi removido da blacklist e pode comprar novamente.`)],
        ephemeral: true,
      });
    }

    // ─── Listar blacklist ─────────────────────────────────────
    if (sub === 'listar') {
      const blacklist = getBlacklist(guildId);

      if (blacklist.length === 0) {
        return interaction.reply({ embeds: [primaryEmbed(`${emojis.ban} Blacklist Vazia`, '> Nenhum usuário está na blacklist.')], ephemeral: true });
      }

      const description = blacklist.map((id, i) => `> \`${i + 1}.\` <@${id}> (\`${id}\`)`).join('\n');

      return interaction.reply({
        embeds: [primaryEmbed(`${emojis.ban} Blacklist — ${blacklist.length} usuário(s)`, description)],
        ephemeral: true,
      });
    }
  },
};
