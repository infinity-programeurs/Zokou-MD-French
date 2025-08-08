// deobfuscated_bot.js
// Version lisible reconstruite — conserve la logique originale observée.

const { StickerTypes } = require('wa-sticker-formatter');
const { zokou } = require('../path/to/zokou'); // adapter le chemin réel
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { exec } = require('child_process'); // used for ffmpeg invocation
const { uploadToCatbox } = require('../framework/function/mesfonctions');
const { sendStickerMessage } = require('../framework/function/baileys');

/**
 * Command: sticker / s
 * - Convertit une image/video (ou media replied) en sticker.
 */
zokou({
  nomCom: 'sticker',
  categorie: 'Conversion',
  reaction: '🎨',
  desc: 'Créer un sticker à partir d\'une image ou d\'une vidéo',
  alias: ['s'],
}, async (conn, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, mtype, prefixe } = context;
  try {
    // si pas de media fourni dans le message et le type n'est pas image/video
    if (!msgRepondu && mtype !== 'imageMessage' && mtype !== 'videoMessage') {
      return repondre(`Veuillez répondre à une image ou envoyer une image avec ${prefixe}s`);
    }

    // downloadMediaMessage attend un objet message ou 'buffer' selon l'API
    const source = ['imageMessage', 'videoMessage'].includes(mtype) ? quotedMsg : { message: msgRepondu };
    const mediaBuffer = await downloadMediaMessage(source, 'buffer');

    await sendStickerMessage(conn, msg, mediaBuffer, {}, { quoted: quotedMsg });
  } catch (err) {
    console.log('[STICKER-CMD-ERROR] :', err);
    repondre('Une erreur est survenue lors de la création du sticker.');
  }
});

/**
 * Command: crop (nom d'exemple)
 * - Crée un sticker avec crop (utilise StickerTypes.CROPPED)
 */
zokou({
  nomCom: 'crop',
  categorie: 'Conversion',
  reaction: '👨🏿‍💻',
  desc: 'Créer un sticker en cropant',
}, async (conn, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, mtype, prefixe } = context;
  try {
    if (!msgRepondu && mtype !== 'videoMessage' && mtype !== 'imageMessage') {
      return repondre(`Veuillez répondre à un media ou envoyer un media avec ${prefixe}s`);
    }

    const source = ['imageMessage', 'videoMessage'].includes(mtype) ? quotedMsg : { message: msgRepondu };
    const media = await downloadMediaMessage(source, 'buffer');

    await sendStickerMessage(conn, msg, media, { type: StickerTypes.CROPPED }, { quoted: quotedMsg });
  } catch (err) {
    console.error('[SCROP-CMD-ERROR] :', err);
    repondre('Une erreur est survenue lors de la création du sticker (crop).');
  }
});

/**
 * Command: take
 * - Modifier packname / author d'un sticker (attend media)
 */
zokou({
  nomCom: 'take',
  categorie: 'Conversion',
  reaction: '🔧',
  desc: 'Modifier l\'author et le packname d\'un sticker',
  alias: ['take'],
}, async (conn, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, mtype, arg: args, nomAuteurMessage } = context;
  try {
    // accept image, video, sticker
    if (!msgRepondu && mtype !== 'imageMessage' && mtype !== 'videoMessage' && mtype !== 'stickerMessage') {
      return repondre(`Veillez répondre a un media, ou envoyer un media avec le texte ${context.prefixe}s`);
    }

    const source = ['imageMessage', 'videoMessage', 'stickerMessage'].includes(mtype) ? quotedMsg : { message: msgRepondu };
    const buffer = await downloadMediaMessage(source, 'buffer');

    // packname from args or fallback to nomAuteurMessage
    const packname = (args && args.length > 0) ? args.join(' ').trim() : nomAuteurMessage;
    // send sticker with given packname (quality 100)
    await sendStickerMessage(conn, msg, buffer, { packname, quality: 100 }, { quoted: quotedMsg });
  } catch (err) {
    console.error('take command error:', err);
    repondre('Une erreur est survenue lors de la création du sticker');
  }
});

/**
 * Command: ecrire
 * - Ajoute un texte sur une image et crée un sticker via Imgur + service externe.
 */
zokou({
  nomCom: 'ecrire',
  categorie: 'Conversion',
  reaction: '✍️',
  desc: 'Faire un sticker avec une image et un texte',
}, async (conn, msg, context) => {
  const { ms: quotedMsg, msgRepondu, arg: args, repondre } = context;

  if (!msgRepondu) return repondre('Veuillez mentionner une image ou répondre à une image.');
  if (!msgRepondu.imageMessage) return repondre('La commande ne fonctionne qu\'avec des images.');

  const text = (args || []).join(' ');
  if (!text) return repondre('Veiller inserer un texte');

  try {
    // télécharge l'image et l'envoie à Imgur (comme dans l'original)
    const imageMsg = msgRepondu.imageMessage;
    const filepath = await conn.downloadAndSaveMediaMessage(imageMsg);
    const form = new FormData();
    form.append('image', fs.createReadStream(filepath));

    // Attention : la clé Imgur doit être dans une var d'env, ici placeholder
    const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'YOUR_IMGUR_CLIENT_ID';
    const headers = { Authorization: `Client-ID ${IMGUR_CLIENT_ID}`, ...form.getHeaders() };

    const resp = await axios({
      method: 'post',
      url: 'https://api.imgur.com/3/image',
      headers,
      data: form,
      maxBodyLength: Infinity,
    });

    const imageUrl = resp.data?.data?.link;
    console.log('Uploaded image URL:', imageUrl);

    // compose url d'un service qui génère sticker + texte (d'après original)
    const stickerUrl = `https://some-service.example/meme?text=${encodeURIComponent(text)}&image=${encodeURIComponent(imageUrl)}`;
    await sendStickerMessage(conn, msg, { url: stickerUrl }, {}, { quoted: quotedMsg });

  } catch (err) {
    console.error('Erreur lors de l\'envoi sur Imgur :', err);
    repondre('Une erreur est survenue lors de la création du mème.');
  } finally {
    // cleanup: try supprimer fichier local s'il existe
    try { if (filepath) fs.unlinkSync(filepath); } catch (e) {}
  }
});

/**
 * Command: photo
 * - Convertir un sticker (non-animé) en image PNG via ffmpeg
 */
zokou({
  nomCom: 'photo',
  categorie: 'Conversion',
  reaction: '👨🏿‍💻',
  desc: 'convertir un sticker en image',
}, async (conn, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre } = context;

  if (!msgRepondu) return repondre('Veuillez mentionner le media');
  if (!msgRepondu.stickerMessage) return repondre('Veuillez mentionner le sticker');

  try {
    const tempSticker = await conn.downloadAndSaveMediaMessage(msgRepondu.stickerMessage);
    const outName = `${Date.now()}.png`;

    // ffmpeg - pour les stickers non-animés, une simple conversion
    exec(`ffmpeg -i ${tempSticker} ${outName}`, (error, stdout, stderr) => {
      try { fs.unlinkSync(tempSticker); } catch (e) {}
      if (error) {
        conn.sendMessage(msg.key.remoteJid, { text: 'Un sticker non animé svp' }, { quoted: quotedMsg });
        return;
      }
      const imageBuffer = fs.readFileSync(outName);
      conn.sendMessage(msg.key.remoteJid, { image: imageBuffer }, { quoted: quotedMsg });
      fs.unlinkSync(outName);
    });
  } catch (err) {
    console.error('photo cmd error:', err);
    repondre('Erreur lors de la conversion du sticker');
  }
});

/**
 * Command: url
 * - Upload file (image/video/sticker) to Catbox (ou service) et renvoie le lien
 */
zokou({
  nomCom: 'url',
  categorie: 'Conversion',
  reaction: '🔗',
  desc: 'Upload media et renvoie un lien',
}, async (conn, msg, context) => {
  const { msgRepondu, repondre } = context;
  if (!msgRepondu) return repondre('veiller mentionner le media');

  try {
    // prefer message.message, puis stickerMessage, etc.
    let target;
    if (msgRepondu.imageMessage) target = msgRepondu.imageMessage;
    else if (msgRepondu.videoMessage) target = msgRepondu.videoMessage;
    else if (msgRepondu.stickerMessage) target = msgRepondu.stickerMessage;
    else return repondre('Media non supporté');

    const filePath = await conn.downloadAndSaveMediaMessage(target);
    const link = await uploadToCatbox(filePath);
    repondre(link);
    try { fs.unlinkSync(filePath); } catch (e) {}
  } catch (err) {
    console.error('url cmd error:', err);
    repondre('Erreur lors de la création du lien');
  }
});
