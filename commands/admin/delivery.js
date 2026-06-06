// ================================================
// commands/admin/delivery.js — Sistema de entrega manual
// ================================================
const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');
const { getTickets, setTickets, getProducts } = require('../../utils/database');
const { successEmbed, errorEmbed, primaryEmbed } = require('../../utils/embedBuilder');
const { checkStaff } = require('../../utils/permissions');
const { emojis } = require('../../config/config');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delivery')
    .setDescription('🤖 Gerencia entregas de pedidos')
    .addSubcommand(sub =>
      sub.setName('entregar')
        .setDescription('Marca um pedido como entregue e notifica o comprador')
        .addStringOption(o => o.setName('ticket_id').setDescription('ID do ticket/pedido').setRequired(true))
        .addStringOption(o => o.setName('info').setDescription('Informação de entrega (ex: login/senha, link, etc)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('pendentes')
        .setDescription('Lista pedidos pendentes de entrega')
    ),

  async execute(interaction, client) {
    if (!checkStaff(interaction)) return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // ─── Entregar pedido ──────────────────────────────────────
    if (sub === 'entregar') {
      const ticketId = interaction.options.getString('ticket_id');
      const info = interaction.options.getString('info');
      const tickets = getTickets(guildId);
      const ticket = tickets[ticketId];

      if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('Não encontrado', `> Ticket \`${ticketId}\` não existe.`)], ephemeral: true });
      }
      if (ticket.status === 'delivered') {
        return interaction.reply({ embeds: [errorEmbed('Já Entregue', '> Este pedido já foi marcado como entregue.')], ephemeral: true });
      }

      // Atualiza status
      tickets[ticketId].status = 'delivered';
      tickets[ticketId].deliveredAt = new Date().toISOString();
      tickets[ticketId].deliveredBy = interaction.user.id;
      setTickets(guildId, tickets);

      // Notifica comprador via DM
      try {
        const buyer = await interaction.client.users.fetch(ticket.userId);
        const products = getProducts(guildId);
        const product = products[ticket.productId];

        const dmEmbed = successEmbed(
          '🎉 Seu Pedido Foi Entregue!',
          [
            `> Olá ${buyer}! Seu pedido foi **entregue** com sucesso!`,
            product ? `> **Produto:** ${product.emoji || '📦'} ${product.nome}` : '',
            info ? `\n> **Informações de entrega:**\n> \`\`\`${info}\`\`\`` : '',
            `\n> Obrigado pela compra! ${emojis.star}`,
          ].filter(Boolean).join('\n')
        );

        await buyer.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch { /* DM pode falhar */ }

      // Log
      await sendLog(client, guildId, 'Pedido Entregue',
        `> **Ticket:** \`${ticketId}\`\n> **Staff:** ${interaction.user.tag}\n> **Info:** ${info || 'Nenhuma'}`,
        interaction.user
      );

      // Notifica no canal do ticket
      const ticketChannel = interaction.guild.channels.cache.get(ticket.channelId);
      if (ticketChannel) {
        const closeBtn = new ButtonBuilder()
          .setCustomId(`close_ticket_${ticketId}`)
          .setLabel('Fechar Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(closeBtn);

        await ticketChannel.send({
          content: `<@${ticket.userId}>`,
          embeds: [successEmbed('🎉 Pedido Entregue!', [
            `> Seu pedido foi entregue por ${interaction.user}!`,
            info ? `> **Informações:**\n> \`\`\`${info}\`\`\`` : '',
          ].filter(Boolean).join('\n'))],
          components: [row],
        }).catch(() => {});
      }

      return interaction.reply({
        embeds: [successEmbed('Entregue!', `> Pedido \`${ticketId}\` marcado como entregue com sucesso.`)],
        ephemeral: true,
      });
    }

    // ─── Listar pendentes ─────────────────────────────────────
    if (sub === 'pendentes') {
      const tickets = getTickets(guildId);
      const pending = Object.values(tickets).filter(t => t.status === 'open');

      if (pending.length === 0) {
        return interaction.reply({ embeds: [primaryEmbed(`${emojis.delivery} Sem Pendências`, '> Nenhum pedido pendente de entrega. ✅')], ephemeral: true });
      }

      const products = getProducts(guildId);
      const description = pending.map(t => {
        const product = products[t.productId];
        return `> 🎫 \`${t.id}\` — <@${t.userId}> | **${product?.nome || 'Produto removido'}** | <t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>`;
      }).join('\n');

      return interaction.reply({
        embeds: [primaryEmbed(`${emojis.delivery} Pedidos Pendentes (${pending.length})`, description)],
        ephemeral: true,
      });
    }
  },
};
