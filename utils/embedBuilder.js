// ================================================
// utils/embedBuilder.js — Construtor de embeds modernas
// ================================================
const { EmbedBuilder } = require('discord.js');
const { colors, emojis, footer } = require('../config/config');

/**
 * Embed de sucesso
 */
function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(colors.success)
    .setTitle(`${emojis.success} ${title}`)
    .setDescription(description)
    .setFooter({ text: footer.text })
    .setTimestamp();
}

/**
 * Embed de erro
 */
function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(colors.error)
    .setTitle(`${emojis.error} ${title}`)
    .setDescription(description)
    .setFooter({ text: footer.text })
    .setTimestamp();
}

/**
 * Embed de aviso
 */
function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(colors.warning)
    .setTitle(`${emojis.warning} ${title}`)
    .setDescription(description)
    .setFooter({ text: footer.text })
    .setTimestamp();
}

/**
 * Embed primária (azul neon)
 */
function primaryEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: footer.text })
    .setTimestamp();
}

/**
 * Embed de produto para loja
 */
function productEmbed(product) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(`${product.emoji || emojis.package} ${product.nome}`)
    .setDescription(product.descricao || 'Sem descrição.')
    .addFields(
      { name: `${emojis.money} Preço`, value: `**R$ ${product.preco.toFixed(2)}**`, inline: true },
      { name: `${emojis.package} Estoque`, value: product.estoque !== null ? `\`${product.estoque}\`` : '`Ilimitado`', inline: true },
    )
    .setFooter({ text: footer.text })
    .setTimestamp();
}

/**
 * Embed de pagamento Pix
 */
function pixEmbed(product, pixConfig) {
  return new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle(`${emojis.pix} Pagamento via Pix`)
    .setDescription(`> Realize o pagamento para confirmar seu pedido de **${product.nome}**.`)
    .addFields(
      { name: `${emojis.arrow} Recebedor`, value: `\`${pixConfig.nome || 'N/A'}\``, inline: true },
      { name: `${emojis.money} Valor`, value: `\`R$ ${product.preco.toFixed(2)}\``, inline: true },
      { name: `${emojis.pix} Chave Pix`, value: `\`\`\`${pixConfig.chave || 'Não configurado'}\`\`\`` },
    )
    .setImage(pixConfig.qrcode || null)
    .setFooter({ text: `${footer.text} • Após pagar, envie o comprovante aqui` })
    .setTimestamp();
}

/**
 * Embed de log de ação
 */
function logEmbed(action, details, user) {
  return new EmbedBuilder()
    .setColor(colors.info)
    .setTitle(`${emojis.log} Log — ${action}`)
    .setDescription(details)
    .setFooter({ text: `${footer.text} • ${user?.tag || 'Sistema'}` })
    .setTimestamp();
}

module.exports = {
  successEmbed,
  errorEmbed,
  warningEmbed,
  primaryEmbed,
  productEmbed,
  pixEmbed,
  logEmbed,
};
