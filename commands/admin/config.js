// ================================================
// commands/admin/config.js — Configurações do servidor
// ================================================
const { SlashCommandBuilder } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../../utils/database');
const { successEmbed, errorEmbed, primaryEmbed } = require('../../utils/embedBuilder');
const { checkStaff } = require('../../utils/permissions');
const { emojis } = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('⚙️ Configura o bot para este servidor')
    .addSubcommand(sub =>
      sub.setName('pix-chave')
        .setDescription('Define a chave Pix para recebimento')
        .addStringOption(o => o.setName('chave').setDescription('Chave Pix (CPF, email, telefone, aleatória)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('pix-qrcode')
        .setDescription('Define a URL do QR Code Pix')
        .addStringOption(o => o.setName('url').setDescription('URL da imagem do QR Code').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('pix-nome')
        .setDescription('Define o nome do recebedor Pix')
        .addStringOption(o => o.setName('nome').setDescription('Nome completo do recebedor').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Define o canal de logs')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para enviar os logs').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('staff-role')
        .setDescription('Define o cargo de staff')
        .addRoleOption(o => o.setName('cargo').setDescription('Cargo de staff/admin do bot').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('ticket-categoria')
        .setDescription('Define a categoria onde os tickets são criados')
        .addChannelOption(o => o.setName('categoria').setDescription('Categoria para os tickets').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Exibe as configurações atuais do servidor')
    ),

  async execute(interaction) {
    if (!checkStaff(interaction)) return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // ─── Pix Chave ────────────────────────────────────────────
    if (sub === 'pix-chave') {
      const chave = interaction.options.getString('chave');
      const config = getGuildConfig(guildId);
      setGuildConfig(guildId, { pix: { ...(config.pix || {}), chave } });
      return interaction.reply({ embeds: [successEmbed('Chave Pix Atualizada', `> Chave Pix definida como:\n> \`\`\`${chave}\`\`\``)], ephemeral: true });
    }

    // ─── Pix QR Code ──────────────────────────────────────────
    if (sub === 'pix-qrcode') {
      const url = interaction.options.getString('url');
      if (!url.startsWith('http')) {
        return interaction.reply({ embeds: [errorEmbed('URL Inválida', '> A URL do QR Code deve começar com `http` ou `https`.')], ephemeral: true });
      }
      const config = getGuildConfig(guildId);
      setGuildConfig(guildId, { pix: { ...(config.pix || {}), qrcode: url } });
      return interaction.reply({ embeds: [successEmbed('QR Code Atualizado', `> QR Code Pix definido com sucesso!`)], ephemeral: true });
    }

    // ─── Pix Nome ─────────────────────────────────────────────
    if (sub === 'pix-nome') {
      const nome = interaction.options.getString('nome');
      const config = getGuildConfig(guildId);
      setGuildConfig(guildId, { pix: { ...(config.pix || {}), nome } });
      return interaction.reply({ embeds: [successEmbed('Nome do Recebedor Atualizado', `> Nome definido como: **${nome}**`)], ephemeral: true });
    }

    // ─── Canal de Logs ────────────────────────────────────────
    if (sub === 'logs') {
      const canal = interaction.options.getChannel('canal');
      setGuildConfig(guildId, { logsChannelId: canal.id });
      return interaction.reply({ embeds: [successEmbed('Canal de Logs Definido', `> Logs serão enviados em <#${canal.id}>.`)], ephemeral: true });
    }

    // ─── Staff Role ───────────────────────────────────────────
    if (sub === 'staff-role') {
      const cargo = interaction.options.getRole('cargo');
      setGuildConfig(guildId, { staffRoleId: cargo.id });
      return interaction.reply({ embeds: [successEmbed('Cargo Staff Definido', `> Membros com <@&${cargo.id}> poderão usar comandos de staff.`)], ephemeral: true });
    }

    // ─── Categoria de Tickets ─────────────────────────────────
    if (sub === 'ticket-categoria') {
      const cat = interaction.options.getChannel('categoria');
      if (cat.type !== 4) { // 4 = GuildCategory
        return interaction.reply({ embeds: [errorEmbed('Inválido', '> Por favor, selecione uma **categoria** de canais.')], ephemeral: true });
      }
      setGuildConfig(guildId, { ticketCategoryId: cat.id });
      return interaction.reply({ embeds: [successEmbed('Categoria Definida', `> Tickets serão criados na categoria **${cat.name}**.`)], ephemeral: true });
    }

    // ─── Ver Configurações ────────────────────────────────────
    if (sub === 'ver') {
      const config = getGuildConfig(guildId);
      const pix = config.pix || {};

      const embed = primaryEmbed(
        `${emojis.settings} Configurações do Servidor`,
        [
          `${emojis.pix} **Pix Chave:** ${pix.chave ? `\`${pix.chave}\`` : '`Não configurado`'}`,
          `${emojis.pix} **Pix Nome:** ${pix.nome ? `\`${pix.nome}\`` : '`Não configurado`'}`,
          `${emojis.pix} **Pix QR Code:** ${pix.qrcode ? '`Configurado ✅`' : '`Não configurado`'}`,
          `${emojis.log} **Canal de Logs:** ${config.logsChannelId ? `<#${config.logsChannelId}>` : '`Não configurado`'}`,
          `${emojis.staff} **Cargo Staff:** ${config.staffRoleId ? `<@&${config.staffRoleId}>` : '`Não configurado`'}`,
          `${emojis.ticket} **Categoria Tickets:** ${config.ticketCategoryId ? `\`${config.ticketCategoryId}\`` : '`Não configurado`'}`,
        ].join('\n')
      );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
