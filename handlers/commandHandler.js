// ================================================
// handlers/commandHandler.js — Carrega todos os comandos
// ================================================
const fs = require('fs');
const path = require('path');

/**
 * Percorre recursivamente a pasta commands e carrega todos os arquivos .js
 */
function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(folderPath, file));
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        console.log(`[Commands] ✅ Carregado: /${command.data.name}`);
      } else {
        console.warn(`[Commands] ⚠️ Ignorado (inválido): ${file}`);
      }
    }
  }
}

module.exports = { loadCommands };
