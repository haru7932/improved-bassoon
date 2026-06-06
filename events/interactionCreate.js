// ================================================
// events/interactionCreate.js — Handler de interações
// ================================================
const { getBlacklist, hasValidLicense } = require('../utils/database');
const { errorEmbed } = require('../utils/embedBuilder');
const { handleButton } = require('../handlers/buttonHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ─── Slash Commands ────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Comandos que não precisam de licença
      const bypassLicense = ['license'];
      const needsLicense = !bypassLicense.includes(interaction.commandName);

      // Verifica licença
      if (needsLicense && !hasValidLicense(interaction.guildId)) {
        return interaction.reply({
          embeds: [errorEmbed('Sem Licença', '> Este servidor não possui licença ativa.\n> Use `/license add` (apenas owner do bot) para ativar.')],
          ephemeral: true,
        });
      }

      // Verifica blacklist
      const blacklist = getBlacklist(interaction.guildId);
      if (blacklist.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed('Bloqueado', '> Você está na **blacklist** deste servidor e não pode usar o bot.')],
          ephemeral: true,
        });
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[Command Error] /${interaction.commandName}:`, err);
        const msg = { embeds: [errorEmbed('Erro Interno', '> Ocorreu um erro ao executar este comando.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
    }

    // ─── Botões ────────────────────────────────────────────────
    if (interaction.isButton()) {
      // Verifica blacklist também nos botões
      const blacklist = getBlacklist(interaction.guildId);
      if (blacklist.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed('Bloqueado', '> Você está na **blacklist** e não pode realizar compras.')],
          ephemeral: true,
        });
      }
      await handleButton(interaction, client);
    }
  },
};
