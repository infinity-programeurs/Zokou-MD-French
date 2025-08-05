const fs = require('fs');
const { zokou, cm } = require('some-module'); // Remplace 'some-module' par le bon chemin
const { format } = require('../framework/function/mesfonctions');
const os = require('os');
const moment = require('moment-timezone');
const Settings = require('settings'); // Remplace si besoin
const s = require('config'); // Remplace si besoin

zokou({
  nomCom: "menu",
  reaction: "📁",
  categorie: "Général",
  desc: "Affiche le menu des commandes du bot",
  alias: []
}, async (message, sock, ctx) => {
  const { prefixe, mybotpic, repondre, ms } = ctx;

  let regroupement = {};
  cm.map((commande) => {
    if (!regroupement[commande.categorie]) regroupement[commande.categorie] = [];
    regroupement[commande.categorie].push(commande.nomCom);
  });

  moment.tz.setDefault(s.TIMEZONE);
  const heure = moment().format("HH:mm:ss");
  const date = moment().format("DD/MM/YYYY");

  let intro = `╭───「 ${s.BOT_NAME} 」───╮\n`;
  intro += `│ 📆 Date : ${date}\n`;
  intro += `│ ⏳ Heure : ${heure}\n`;
  intro += `│ 🔖 Préfixe : ${s.PREFIX}\n`;
  intro += `│ 👑 Owner : ${s.OWNER_NAME}\n`;
  intro += `│ 🛰 Mode : ${Settings.botMode}\n`;
  intro += `│ 🛠 Auto-Read : ${Settings.autoRead}\n`;
  intro += `│ 📚 Commandes : ${cm.length}\n`;
  intro += `│ 🧠 RAM : ${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}\n`;
  intro += `│ 💻 Plateforme : ${os.platform()}\n`;
  intro += `╰────────────────────╯\n`;

  let menuText = "\n";

  for (let categorie in regroupement) {
    menuText += `│\n│ 📌 *${categorie.toUpperCase()}*\n│\n`;
    const cmds = regroupement[categorie];
    const nbColonnes = Math.ceil(cmds.length / 2);
    const lignes = [];

    for (let i = 0; i < cmds.length; i += nbColonnes) {
      lignes.push(cmds.slice(i, i + nbColonnes));
    }

    const maxLongueur = Math.max(...cmds.map(x => x.length));

    for (let col = 0; col < nbColonnes; col++) {
      let ligne = "│ ";
      lignes.forEach(part => {
        if (part[col]) ligne += `• ${part[col].padEnd(maxLongueur)}  `;
      });
      menuText += ligne + "\n";
    }
  }

  menuText += "\n╭──────────────╮\n";
  menuText += `│ Tape : ${prefixe}help\n`;
  menuText += `│ Ou : ${prefixe}menu\n`;
  menuText += "╰──────────────╯\n\n";
  menuText += "─ Menu généré par M๏𝓷keℽ D Lบffy\n";
  menuText += "✦⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅✦";

  const mediaUrl = mybotpic();
  const quoted = ms;

  try {
    if (mediaUrl.match(/\.(mp4|gif|ts)$/i)) {
      await sock.sendMessage(message, {
        video: { url: mediaUrl },
        caption: intro + menuText,
        footer: "Généré automatiquement",
        gifPlayback: false
      }, { quoted });
    } else if (mediaUrl.match(/\.(jpg|jpeg|png)$/i)) {
      await sock.sendMessage(message, {
        image: { url: mediaUrl },
        caption: intro + menuText,
        footer: "Généré automatiquement"
      }, { quoted });
    } else {
      await repondre(intro + menuText);
    }
  } catch (err) {
    console.log("🥵🥵 Menu erreur " + err);
    await repondre("🥵🥵 Menu erreur " + err);
  }
});
