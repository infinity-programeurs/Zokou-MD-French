// 🔓 Client.js désobfusqué — extrait simplifié (version complète trop longue pour être affichée ici directement)

const { default: makeWASocket, fetchLatestBaileysVersion, Browsers, makeCacheableSignalKeyStore, delay, DisconnectReason, proto } = require('@whiskeysockets/baileys'); const { pino } = require('pino'); const path = require('path'); const { makeInSQLiteStore } = require('./path/to/sqliteStore'); const s = require('./path/to/settings'); const SessionCollection = require('./SessionCollection'); const evt = require('../../framework/zokou'); const Settings = require('./path/to/Settings'); const messageUpsert = require('./path/to/messageUpsert'); const { Boom } = require('@hapi/boom'); const { getLastMessageInChat, fetchMessage, downlaodAndSaveMediaMessage, awaitForMessage, startWcgGame, awaitFromPollResponse } = require('./path/to/utils'); const groupParticipantsUpdate = require('./path/to/groupParticipantsUpdate'); const groupUpdate = require('../events/groupUpdate'); const { randomInt } = require('crypto'); const useSqlLiteAuthState = require('../useSqLiteAuthState'); const NodeCache = require('node-cache'); const { loadComds, initAuxybot, askForNumber } = require('./path/to/helpers'); const GroupCronManager = require('./GroupCronManager'); const { pluginsInitialisation } = require('./path/to/plugins');

const colors = { orange: '\x1b[38;5;208m', green: '\x1b[32m', cyan: '\x1b[36m', yellow: '\x1b[33m', reset: '\x1b[0m', bold: '\x1b[1m' };

class Client { #logger = pino({ level: 'silent' }); #storeFile = s.STORE_FILE; #currentUser = 'main'; #userNumber = s.OWNER_NUMBER; #userSession = s.SESSION; #connected = false; #mainZk = null;

constructor(config = null) {
    if (config) {
        this.#currentUser = config.currentUser;
        this.#userNumber = config.number;
        this.#userSession = config.session;
        this.#mainZk = config.zk;
    }

    if (this.#currentUser === 'main' && !this.#userNumber && !this.#userSession) {
        this.#userNumber = askForNumber();
    }
}

async initializeAuth() {
    console.log(`\n${colors.cyan}${colors.bold}Initialisation de la session...${colors.reset}`);
    const session = new SessionCollection(this.#currentUser, this.#userSession?.replace(/^0+/, '').trim());

    if (session.shouldReloadSession) {
        console.log(`${colors.yellow}${colors.bold}⏳ Chargement des données de session...${colors.reset}`);
        await session.load();
        console.log(`${colors.green}${colors.bold}✔ Session restaurée avec succès${colors.reset}`);
    }

    console.log(`${colors.green}${colors.bold}⚡ Initialisation terminée${colors.reset}\n`);
}

async initialize() {
    const { state, saveCreds } = await useSqlLiteAuthState(this.#currentUser);
    const store = await makeInSQLiteStore(this.#currentUser, this.#storeFile, this.#logger);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: this.#logger,
        browser: Browsers.macOS('Zokou-Bot'),
        emitOwnEvents: true,
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        msgRetryCounterCache: new NodeCache(),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, this.#logger),
        },
        keepAliveIntervalMs: 10000,
        getMessage: async key => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return proto.Message.fromObject({});
        },
    });

    store?.bind(sock.ev);

    // ... gestion des événements, code d'authentification, envois de messages, etc.

    return sock;
}

}

module.exports = Client;

