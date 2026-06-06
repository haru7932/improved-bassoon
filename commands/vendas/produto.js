// ================================================
// commands/vendas/produto.js — Gerencia produtos da loja
// ================================================
const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');
const { getProducts, setProducts } = require('../../utils/database');
const { successEmbed, errorEmbed, productEmbed, primaryEmbed } = require('../../utils/embedBuilder');
const { checkStaff } = require('../../utils/permissions');
const { emojis } = require('../../config/config');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('produto')
    .setDescription('📦 Gerencia produtos da loja')
    .addSubcommand(sub =>
      sub.setName('criar')
        .setDescription('Cria um novo produto')
        .addStringOption(o => o.setName('nome').setDescription('Nome do produto').setRequired(true))
        .addNumberOption(o => o.setName('preco').setDescription('Preço em R$').setRequired(true).setMinValue(0.01))
        .addStringOption(o => o.setName('descricao').setDescription('Descrição do produto').setRequired(true))
        .addStringOption(o => o.setName('emoji').setDescription('Emoji do produto (ex: 🎮)').setRequired(false))
        .addIntegerOption(o => o.setName('estoque').setDescription('Quantidade em estoque (deixe vazio para ilimitado)').setRequired(false).setMinValue(0))
    )
    .addSubcommand(sub =>
      sub.setName('remover')
        .setDescription('Remove um produto')
        .addStringOption(o => o.setName('id').setDescription('ID do produto').setRequired(true).setAutocomplete(true))
    )
    .addSubcommand(sub =>
      sub.setName('listar')
        .setDescription('Lista todos os produtos')
    )
    .addSubcommand(sub =>
      sub.setName('postar')
        .setDescription('Posta embed de compra de um produto no canal atual')
        .addStringOption(o => o.setName('id').setDescription('ID do produto').setRequired(true).setAutocomplete(true))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    // ─── Criar produto ────────────────────────────────────────
    if (sub === 'criar') {
      if (!checkStaff(interaction)) return;

      const nome = interaction.options.getString('nome');
      const preco = interaction.options.getNumber('preco');
      const descricao = interaction.options.getString('descricao');
      const emoji = interaction.options.getString('emoji') || '📦';
      const estoque = interaction.options.getInteger('estoque') ?? null;

      const products = getProducts(interaction.guildId);
      // ID único baseado em timestamp
      const id = `prod_${Date.now()}`;

      products[id] = { id, nome, preco, descricao, emoji, estoque, criadoEm: new Date().toISOString() };
      setProducts(interaction.guildId, products);

      await sendLog(client, interaction.guildId, 'Produto Criado', `> **Nome:** ${nome}\n> **Preço:** R$ ${preco.toFixed(2)}\n> **ID:** \`${id}\``, interaction.user);

      return interaction.reply({
        embeds: [successEmbed('Produto Criado!', `> **${emoji} ${nome}** foi adicionado à loja!\n> **ID:** \`${id}\`\n> Use \`/produto postar\` para criar o embed de compra.`)],
        ephemeral: true,
      });
    }

    // ─── Remover produto ──────────────────────────────────────
    if (sub === 'remover') {
      if (!checkStaff(interaction)) return;

      const id = interaction.options.getString('id');
      const products = getProducts(interaction.guildId);

      if (!products[id]) {
        return interaction.reply({ embeds: [errorEmbed('Não encontrado', '> Produto com este ID não existe.')], ephemeral: true });
      }

      const nome = products[id].nome;
      delete products[id];
      setProducts(interaction.guildId, products);

      await sendLog(client, interaction.guildId, 'Produto Removido', `> **Nome:** ${nome}\n> **ID:** \`${id}\``, interaction.user);

      return interaction.reply({
        embeds: [successEmbed('Produto Removido', `> **${nome}** foi removido da loja.`)],
        ephemeral: true,
      });
    }

    // ─── Listar produtos ──────────────────────────────────────
    if (sub === 'listar') {
      if (!checkStaff(interaction)) return;

      const products = getProducts(interaction.guildId);
      const list = Object.values(products);

      if (list.length === 0) {
        return interaction.reply({ embeds: [errorEmbed('Sem Produtos', '> Nenhum produto cadastrado ainda.\n> Use `/produto criar` para adicionar.')], ephemeral: true });
      }

      const description = list.map(p =>
        `> ${p.emoji} **${p.nome}** — \`R$ ${p.preco.toFixed(2)}\`\n> ID: \`${p.id}\` | Estoque: ${p.estoque !== null ? p.estoque : 'Ilimitado'}`
      ).join('\n\n');

      return interaction.reply({
        embeds: [primaryEmbed(`${emojis.store} Produtos Cadastrados (${list.length})`, description)],
        ephemeral: true,
      });
    }

    // ─── Postar embed de compra ───────────────────────────────
    if (sub === 'postar') {
      if (!checkStaff(interaction)) return;

      const id = interaction.options.getString('id');
      const products = getProducts(interaction.guildId);
      const product = products[id];

      if (!product) {
        return interaction.reply({ embeds: [errorEmbed('Não encontrado', '> Produto com este ID não existe.')], ephemeral: true });
      }

      const embed = productEmbed(product);

      const buyBtn = new ButtonBuilder()
        .setCustomId(`buy_${id}`)
        .setLabel('Comprar')
        .setEmoji('🛒')
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(buyBtn);

      await interaction.channel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        embeds: [successEmbed('Embed Postado!', `> O embed de compra de **${product.nome}** foi enviado neste canal.`)],
        ephemeral: true,
      });
    }
  },
};
