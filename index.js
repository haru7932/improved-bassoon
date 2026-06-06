// ================================================
// index.js — Ponto de entrada principal do bot
// ================================================
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

// Criação do client com todas as intents necessárias
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Coleções para comandos e cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Carrega comandos e eventos
loadCommands(client);
loadEvents(client);

// Login do bot
client.login(process.env.TOKEN);
