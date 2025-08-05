// 🔓 SessionCollection.js désobfusqué

const sessionDb = require('../../bdd/session'); const authDb = require('../../bdd/auth'); const axios = require('axios');

class SessionManager { sessionApi = 'https://zokou-api.vercel.app/api/session?uid=';

#userId = null;
#shouldReloadSession = false;
#userSession = null;

constructor(userId, userSession = null) {
    this.#userId = userId;
    this.#userSession = userSession;

    const existingSession = sessionDb.getSession(this.#userId);

    if (!existingSession) {
        sessionDb.setSession(userId, userSession);
        if (userSession) this.#shouldReloadSession = true;
        return;
    }

    if (existingSession?.id === this.#userSession) {
        if (userSession == null) return;
        return this.#checkIfShouldReconnect();
    }

    authDb.removeDocsFromId(this.#userId);
    sessionDb.setSession(this.#userId, this.#userSession);
    this.#shouldReloadSession = true;
}

get shouldReloadSession() {
    return this.#shouldReloadSession;
}

async fetchSessionFromApi(sessionId) {
    const response = await axios.get(this.sessionApi + 'id=' + sessionId + '&project=zokou-md');
    if (response?.data?.session) {
        return response.data.session;
    } else {
        throw new Error('Session API error');
    }
}

async load() {
    const sessionData = await this.fetchSessionFromApi(this.#userSession);
    authDb.setCreds(this.#userId, sessionData);
}

#checkIfShouldReconnect() {
    this.#shouldReloadSession = !authDb.hasCreds(this.#userId);
    return this.#shouldReloadSession;
}

}

module.exports = SessionManager;

