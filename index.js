const Client = require("whatsapp-web.js");
const webApp = require("express")();

async function start() {
    const styles = {
        orange: "\x1b[38;5;208m",
        bold: "\x1b[1m",
        green: "\x1b[32m",
        cyan: "\x1b[36m",
        reset: "\x1b[0m",
    };

    console.log(
        styles.orange +
            styles.bold +
            `
    ███████╗ ██████╗ ██╗  ██╗ ██████╗ ██╗   ██╗    ███╗   ███╗██████╗
    ╚══███╔╝██╔═══██╗██║ ██╔╝██╔═══██╗██║   ██║    ████╗ ████║██╔══██╗
      ███╔╝ ██║   ██║█████╔╝ ██║   ██║██║   ██║    ██╔████╔██║██║  ██║
     ███╔╝  ██║   ██║██╔═██╗ ██║   ██║██║   ██║    ██║╚██╔╝██║██║  ██║
    ███████╗╚██████╔╝██║  ██╗╚██████╔╝╚██████╔╝    ██║ ╚═╝ ██║██████╔╝
    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝     ╚═╝     ╚═╝╚═════╝`
    );

    console.log(
        styles.green +
            styles.bold +
            "\n\n  BOT DÉMARRÉ PAR WEVY" +
            styles.reset
    );
    console.log(styles.cyan + "Initialisation en cours..." + styles.reset + "\n");

    const client = new Client();

    await client.initializeAuth();
    client.initialize();
}

start();

try {
    webApp.listen(process.env.PORT || 3000);
} catch (e) {
    // silence error
}
