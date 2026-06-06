// ================================================
// handlers/deployCommands.js — Deploy dos Slash Commands
// Rode com: node handlers/deployCommands.js
// ================================================
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '../commands');
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(folderPath, file));
    if (cmd?.data) commands.push(cmd.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`[Deploy] Enviando ${commands.length} comandos para a API...`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('[Deploy] ✅ Comandos registrados com sucesso!');
  } catch (err) {
    console.error('[Deploy] ❌ Erro ao registrar comandos:', err);
  }
})();
