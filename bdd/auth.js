// 🔓 Fichier désobfusqué : gestion des credentials avec SQLite

const InitializeConnection = require('./path/to/InitializeConnection'); const db = InitializeConnection();

// Création des tables "wacreds" et "wakeys" const createTables = async () => { db.prepare('CREATE TABLE IF NOT EXISTS wacreds (id TEXT PRIMARY KEY, creds TEXT)').run(); db.prepare('CREATE TABLE IF NOT EXISTS wakeys (id TEXT PRIMARY KEY, keys TEXT)').run(); };

createTables();

// Insère ou met à jour les documents pour un ID donné const loadsDocs = (id, documents) => { for (const doc of documents) { const { _id, ...rest } = doc; const json = JSON.stringify(rest);

if (_id === 'creds') {
        db.prepare('INSERT OR REPLACE INTO wacreds (id, creds) VALUES (?, ?)').run(id, json);
    } else {
        db.prepare('INSERT OR REPLACE INTO wakeys (id, keys) VALUES (?, ?)').run(id, _id, json);
    }
}

};

// Supprime les données pour un ID const removeDocsFromId = id => { db.prepare('DELETE FROM wacreds WHERE id = ?').run(id); db.prepare('DELETE FROM wakeys WHERE id = ?').run(id); };

// Vérifie si des credentials existent pour un ID const hasCreds = id => { return db.prepare('SELECT * FROM wacreds WHERE id = ?').get(id) !== undefined; };

module.exports = { loadsDocs, removeDocsFromId, hasCreds };

