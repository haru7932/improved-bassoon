// ================================================
// events/ready.js — Evento de bot pronto
// ================================================
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`\n╔══════════════════════════════════╗`);
    console.log(`║  🏪 Bot de Vendas Online!         ║`);
    console.log(`║  Logado como: ${client.user.tag.padEnd(18)}║`);
    console.log(`║  Servidores: ${String(client.guilds.cache.size).padEnd(19)}║`);
    console.log(`╚══════════════════════════════════╝\n`);

    client.user.setPresence({
      activities: [{ name: '🏪 Sistema de Vendas', type: 3 }],
      status: 'online',
    });
  },
};
