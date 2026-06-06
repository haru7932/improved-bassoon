# 🏪 Bot de Vendas Discord — Multi-Servidor

Bot profissional de vendas para Discord com sistema Pix, tickets, blacklist, logs e licenças.

---

## ⚙️ Tecnologias
- **Node.js 18+**
- **discord.js v14**
- Banco de dados JSON (sem dependências externas)
- Slash Commands, Buttons, Embeds modernas

---

## 📁 Estrutura

```
discord-bot/
├── commands/
│   ├── admin/
│   │   ├── blacklist.js
│   │   ├── config.js
│   │   └── delivery.js
│   ├── owner/
│   │   └── license.js
│   └── vendas/
│       └── produto.js
├── database/          ← gerado automaticamente
├── events/
│   ├── interactionCreate.js
│   └── ready.js
├── handlers/
│   ├── buttonHandler.js
│   ├── commandHandler.js
│   ├── deployCommands.js
│   └── eventHandler.js
├── utils/
│   ├── database.js
│   ├── embedBuilder.js
│   ├── logger.js
│   └── permissions.js
├── config/
│   └── config.js
├── index.js
├── package.json
└── .env
```

---

## 🚀 Instalação

### 1. Clone ou baixe o projeto

```bash
npm install
```

### 2. Configure o `.env`

Copie `.env.example` para `.env` e preencha:

```env
TOKEN=SEU_TOKEN_AQUI
OWNER_ID=SEU_ID_AQUI
CLIENT_ID=SEU_CLIENT_ID_AQUI
```

- **TOKEN**: Token do bot no [Discord Developer Portal](https://discord.com/developers/applications)
- **OWNER_ID**: Seu ID de usuário Discord (ative Modo Desenvolvedor → clique com botão direito no seu perfil → Copiar ID)
- **CLIENT_ID**: ID da aplicação (aba General Information no Developer Portal)

### 3. Deploy dos Slash Commands

```bash
node handlers/deployCommands.js
```

### 4. Inicie o bot

```bash
npm start
# ou
node index.js
```

---

## 📋 Comandos

### 🔒 Owner do Bot
| Comando | Descrição |
|---------|-----------|
| `/license add` | Adiciona licença mensal ou permanente a um servidor |
| `/license remove` | Remove licença de um servidor |
| `/license status` | Verifica status de uma licença |
| `/license listar` | Lista todas as licenças |

### ⚙️ Admin / Staff
| Comando | Descrição |
|---------|-----------|
| `/config pix-chave` | Define a chave Pix |
| `/config pix-qrcode` | Define URL do QR Code Pix |
| `/config pix-nome` | Define nome do recebedor |
| `/config logs` | Define canal de logs |
| `/config staff-role` | Define cargo de staff |
| `/config ticket-categoria` | Define categoria dos tickets |
| `/config ver` | Exibe configurações atuais |
| `/blacklist add` | Adiciona usuário à blacklist |
| `/blacklist remove` | Remove usuário da blacklist |
| `/blacklist listar` | Lista usuários banidos |
| `/delivery entregar` | Marca pedido como entregue |
| `/delivery pendentes` | Lista pedidos pendentes |
| `/produto criar` | Cria um produto |
| `/produto remover` | Remove um produto |
| `/produto listar` | Lista produtos |
| `/produto postar` | Posta embed de compra no canal |

---

## 🌍 Multi-Servidor

Todos os dados são separados por `guild.id`:
- Produtos, configs, Pix, logs, blacklist, tickets e pagamentos ficam isolados por servidor
- Um servidor sem licença não consegue usar nenhuma função do bot

---

## 💸 Fluxo de Compra

1. Staff usa `/produto criar` para cadastrar um produto
2. Staff usa `/produto postar` para enviar o embed com o botão 🛒 Comprar
3. Cliente clica em **Comprar** → bot cria ticket privado com embed Pix
4. Cliente realiza o pagamento e envia o comprovante no ticket
5. Staff usa `/delivery entregar` para marcar como entregue e notificar o cliente
6. Ticket é fechado

---

## 🖥️ Hospedagem

Compatível com:
- **Render** (Free tier com Node.js)
- **Railway**
- **Replit**
- **VPS** (Ubuntu, Debian, etc.)

Para manter o bot online no Render/Replit, adicione um health check com um servidor HTTP simples (adicione `express` e escute uma porta).

---

## 📄 Licença

Uso pessoal e comercial permitido. Não redistribua sem créditos.
