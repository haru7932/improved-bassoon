// ================================================
// handlers/buttonHandler.js — Gerencia cliques em botões
// ================================================
const {
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');
const { getGuildConfig, getProducts, getTickets, setTickets, addPayment } = require('../utils/database');
const { pixEmbed, successEmbed, errorEmbed, primaryEmbed } = require('../utils/embedBuilder');
const { sendLog } = require('../utils/logger');
const { emojis } = require('../config/config');

async function handleButton(interaction, client) {
  const { customId, guild, member, user } = interaction;

  // ─── Botão de Compra ──────────────────────────────────────
  // customId formato: buy_PRODUCTID
  if (customId.startsWith('buy_')) {
    const productId = customId.replace('buy_', '');
    const products = getProducts(guild.id);
    const product = products[productId];

    if (!product) {
      return interaction.reply({ embeds: [errorEmbed('Produto não encontrado', '> Este produto não está mais disponível.')], ephemeral: true });
    }

    // Verifica estoque
    if (product.estoque !== null && product.estoque <= 0) {
      return interaction.reply({ embeds: [errorEmbed('Sem Estoque', `> O produto **${product.nome}** está sem estoque no momento.`)], ephemeral: true });
    }

    const config = getGuildConfig(guild.id);

    // ── Cria ticket privado ──
    await interaction.deferReply({ ephemeral: true });

    try {
      // Verifica se usuário já tem ticket aberto para este produto
      const tickets = getTickets(guild.id);
      const existingTicket = Object.values(tickets).find(
        t => t.userId === user.id && t.productId === productId && t.status === 'open'
      );
      if (existingTicket) {
        const ch = guild.channels.cache.get(existingTicket.channelId);
        return interaction.editReply({
          embeds: [errorEmbed('Ticket Aberto', `> Você já possui um ticket aberto: <#${existingTicket.channelId}>`)],
        });
      }

      // Permissões do canal de ticket
      const permOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // @everyone não vê
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ];

      // Adiciona staff se configurado
      if (config.staffRoleId) {
        permOverwrites.push({
          id: config.staffRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
      }

      // Categoria de tickets (opcional)
      const channelOptions = {
        name: `🎫・${user.username}-${productId.slice(0, 6)}`,
        type: ChannelType.GuildText,
        topic: `Compra de ${product.nome} por ${user.tag}`,
        permissionOverwrites: permOverwrites,
      };
      if (config.ticketCategoryId) channelOptions.parent = config.ticketCategoryId;

      const ticketChannel = await guild.channels.create(channelOptions);

      // Registra ticket no banco
      const ticketId = `${user.id}-${Date.now()}`;
      const ticketsDb = getTickets(guild.id);
      ticketsDb[ticketId] = {
        id: ticketId,
        userId: user.id,
        productId,
        channelId: ticketChannel.id,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      setTickets(guild.id, ticketsDb);

      // Botão de fechar ticket
      const closeBtn = new ButtonBuilder()
        .setCustomId(`close_ticket_${ticketId}`)
        .setLabel('Fechar Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder().addComponents(closeBtn);

      // Embed de boas-vindas no ticket
      const welcomeEmbed = primaryEmbed(
        `${emojis.ticket} Ticket de Compra`,
        `> Olá ${user}! Seu ticket foi criado.\n> Aguarde a confirmação do pagamento ou envie o comprovante.`
      ).addFields(
        { name: `${emojis.package} Produto`, value: `**${product.emoji || '📦'} ${product.nome}**`, inline: true },
        { name: `${emojis.money} Valor`, value: `**R$ ${product.preco.toFixed(2)}**`, inline: true },
      );

      // Embed de Pix
      const pixConfig = config.pix || {};
      const pixMsg = pixEmbed(product, pixConfig);

      // Menciona staff
      const staffMention = config.staffRoleId ? `<@&${config.staffRoleId}>` : '';
      await ticketChannel.send({
        content: `${user} ${staffMention}`,
        embeds: [welcomeEmbed, pixMsg],
        components: [row],
      });

      // Reduz estoque se configurado
      if (product.estoque !== null) {
        const productsDb = getProducts(guild.id);
        productsDb[productId].estoque -= 1;
        const { setProducts } = require('../utils/database');
        setProducts(guild.id, productsDb);
      }

      // Registra pagamento
      addPayment(guild.id, {
        ticketId,
        userId: user.id,
        productId,
        valor: product.preco,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      });

      // Envia log
      await sendLog(client, guild.id, 'Ticket Aberto', `> **Usuário:** ${user.tag}\n> **Produto:** ${product.nome}\n> **Canal:** <#${ticketChannel.id}>`, user);

      await interaction.editReply({
        embeds: [successEmbed('Ticket Criado!', `> Seu ticket foi aberto em <#${ticketChannel.id}>.\n> Siga as instruções para finalizar sua compra.`)],
      });
    } catch (err) {
      console.error('[Button] Erro ao criar ticket:', err);
      await interaction.editReply({ embeds: [errorEmbed('Erro', '> Não foi possível criar o ticket. Verifique as permissões do bot.')] });
    }
  }

  // ─── Botão de Fechar Ticket ──────────────────────────────────
  // customId formato: close_ticket_TICKETID
  if (customId.startsWith('close_ticket_')) {
    const ticketId = customId.replace('close_ticket_', '');
    const tickets = getTickets(guild.id);
    const ticket = tickets[ticketId];

    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Ticket inválido', '> Este ticket não existe no banco de dados.')], ephemeral: true });

    const config = getGuildConfig(guild.id);
    const isStaff = member.permissions.has(PermissionFlagsBits.Administrator) || (config.staffRoleId && member.roles.cache.has(config.staffRoleId));
    const isOwner = user.id === ticket.userId;

    if (!isStaff && !isOwner) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', '> Apenas Staff ou o dono do ticket podem fechá-lo.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed('Fechando Ticket', '> O canal será deletado em **5 segundos**...')] });

    // Atualiza status no banco
    tickets[ticketId].status = 'closed';
    tickets[ticketId].closedAt = new Date().toISOString();
    setTickets(guild.id, tickets);

    // Envia log
    await sendLog(client, guild.id, 'Ticket Fechado', `> **Fechado por:** ${user.tag}\n> **Canal:** ${interaction.channel.name}`, user);

    // Deleta o canal após 5s
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  // ─── Botão de Marcar Entregue ──────────────────────────────
  // customId formato: deliver_TICKETID
  if (customId.startsWith('deliver_')) {
    const ticketId = customId.replace('deliver_', '');
    const config = getGuildConfig(guild.id);
    const isStaff = member.permissions.has(PermissionFlagsBits.Administrator) || (config.staffRoleId && member.roles.cache.has(config.staffRoleId));

    if (!isStaff) {
      return interaction.reply({ embeds: [errorEmbed('Sem Permissão', '> Apenas Staff pode marcar como entregue.')], ephemeral: true });
    }

    const tickets = getTickets(guild.id);
    if (!tickets[ticketId]) return interaction.reply({ embeds: [errorEmbed('Ticket inválido', '> Ticket não encontrado.')], ephemeral: true });

    tickets[ticketId].status = 'delivered';
    tickets[ticketId].deliveredAt = new Date().toISOString();
    setTickets(guild.id, tickets);

    await interaction.reply({ embeds: [successEmbed('Pedido Entregue! 🎉', `> O pedido foi marcado como **entregue** por ${user}.`)] });
    await sendLog(client, guild.id, 'Pedido Entregue', `> **Staff:** ${user.tag}\n> **Ticket:** ${ticketId}`, user);
  }
}

module.exports = { handleButton };
