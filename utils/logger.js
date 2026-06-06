// ================================================
// utils/logger.js — Envia logs para o canal configurado
// ================================================
const { getGuildConfig } = require('./database');
const { logEmbed } = require('./embedBuilder');

/**
 * Envia log para o canal de logs da guild
 * @param {Client} client
 * @param {string} guildId
 * @param {string} action - Tipo de ação (ex: 'Compra', 'Ticket Aberto')
 * @param {string} details - Descrição detalhada
 * @param {User} [user] - Usuário que realizou a ação
 */
async function sendLog(client, guildId, action, details, user = null) {
  try {
    const config = getGuildConfig(guildId);
    if (!config.logsChannelId) return;

    const channel = await client.channels.fetch(config.logsChannelId).catch(() => null);
    if (!channel) return;

    const embed = logEmbed(action, details, user);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[Logger] Erro ao enviar log:', err.message);
  }
}

module.exports = { sendLog };
