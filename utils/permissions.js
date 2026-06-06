// ================================================
// utils/permissions.js — Verificações de permissão
// ================================================
const { getGuildConfig, hasValidLicense } = require('./database');
const { errorEmbed } = require('./embedBuilder');

/**
 * Verifica se a guild tem licença válida
 */
function checkLicense(interaction) {
  if (!hasValidLicense(interaction.guildId)) {
    interaction.reply({
      embeds: [errorEmbed('Sem Licença', '> Este servidor não possui uma licença válida.\n> Contate o dono do bot para adquirir uma.')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

/**
 * Verifica se o usuário é staff ou admin
 */
function checkStaff(interaction) {
  const config = getGuildConfig(interaction.guildId);
  const member = interaction.member;

  // Administrador do servidor sempre pode
  if (member.permissions.has('Administrator')) return true;

  // Verifica cargo staff configurado
  if (config.staffRoleId && member.roles.cache.has(config.staffRoleId)) return true;

  interaction.reply({
    embeds: [errorEmbed('Sem Permissão', '> Você não tem permissão para usar este comando.\n> Apenas membros **Staff** podem executar esta ação.')],
    ephemeral: true,
  });
  return false;
}

/**
 * Verifica se é o dono do bot
 */
function checkOwner(interaction) {
  if (interaction.user.id !== process.env.OWNER_ID) {
    interaction.reply({
      embeds: [errorEmbed('Sem Permissão', '> Apenas o **dono do bot** pode usar este comando.')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

module.exports = { checkLicense, checkStaff, checkOwner };
