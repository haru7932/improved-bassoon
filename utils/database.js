// ================================================
// utils/database.js — Gerenciador de banco de dados JSON
// ================================================
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../database');

// Garante que o diretório de banco existe
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

/**
 * Lê um arquivo JSON do banco de dados
 * @param {string} filename - Nome do arquivo (sem .json)
 * @returns {Object} Dados do arquivo
 */
function readDB(filename) {
  const filePath = path.join(DB_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}), 'utf-8');
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Escreve dados em um arquivo JSON do banco de dados
 * @param {string} filename - Nome do arquivo (sem .json)
 * @param {Object} data - Dados para salvar
 */
function writeDB(filename, data) {
  const filePath = path.join(DB_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Funções por guild ────────────────────────────────────────

/** Retorna config de uma guild */
function getGuildConfig(guildId) {
  const db = readDB('configs');
  return db[guildId] || {};
}

/** Salva config de uma guild */
function setGuildConfig(guildId, config) {
  const db = readDB('configs');
  db[guildId] = { ...(db[guildId] || {}), ...config };
  writeDB('configs', db);
}

/** Retorna produtos de uma guild */
function getProducts(guildId) {
  const db = readDB('products');
  return db[guildId] || {};
}

/** Salva produtos de uma guild */
function setProducts(guildId, products) {
  const db = readDB('products');
  db[guildId] = products;
  writeDB('products', db);
}

/** Retorna blacklist de uma guild */
function getBlacklist(guildId) {
  const db = readDB('blacklist');
  return db[guildId] || [];
}

/** Salva blacklist de uma guild */
function setBlacklist(guildId, list) {
  const db = readDB('blacklist');
  db[guildId] = list;
  writeDB('blacklist', db);
}

/** Retorna tickets de uma guild */
function getTickets(guildId) {
  const db = readDB('tickets');
  return db[guildId] || {};
}

/** Salva tickets de uma guild */
function setTickets(guildId, tickets) {
  const db = readDB('tickets');
  db[guildId] = tickets;
  writeDB('tickets', db);
}

/** Retorna pagamentos de uma guild */
function getPayments(guildId) {
  const db = readDB('payments');
  return db[guildId] || [];
}

/** Adiciona pagamento a uma guild */
function addPayment(guildId, payment) {
  const db = readDB('payments');
  if (!db[guildId]) db[guildId] = [];
  db[guildId].push(payment);
  writeDB('payments', db);
}

/** Retorna licenças */
function getLicenses() {
  return readDB('licenses');
}

/** Salva licenças */
function setLicenses(data) {
  writeDB('licenses', data);
}

/** Verifica se guild tem licença válida */
function hasValidLicense(guildId) {
  const licenses = getLicenses();
  const lic = licenses[guildId];
  if (!lic) return false;
  if (lic.type === 'permanente') return true;
  if (lic.type === 'mensal') {
    return new Date(lic.expiresAt) > new Date();
  }
  return false;
}

module.exports = {
  readDB, writeDB,
  getGuildConfig, setGuildConfig,
  getProducts, setProducts,
  getBlacklist, setBlacklist,
  getTickets, setTickets,
  getPayments, addPayment,
  getLicenses, setLicenses,
  hasValidLicense,
};
