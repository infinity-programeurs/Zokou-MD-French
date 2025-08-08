const { StickerTypes } = require('wa-sticker-formatter');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const { uploadToCatbox } = require('../framework/function/mesfonctions');
const { sendStickerMessage } = require('../framework/function/baileys');

// Fonction utilitaire pour nettoyer les fichiers temporaires
async function withTempFile(filePath, callback) {
  try {
    return await callback(filePath);
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// Commande sticker de base
zokou({
  nomCom: 'sticker',
  categorie: 'Conversion',
  reaction: '🎨',
  desc: 'Convertir une image/vidéo en sticker',
  alias: ['s']
}, async (dest, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, mtype } = context;

  try {
    if (!msgRepondu && !['imageMessage', 'videoMessage'].includes(mtype)) {
      return repondre('Répondez à une image/vidéo ou envoyez-en une avec la commande');
    }

    const media = msgRepondu ? { message: msgRepondu } : quotedMsg;
    const buffer = await downloadMediaMessage(media, 'buffer');

    await sendStickerMessage(dest, msg, buffer, {}, { quoted: quotedMsg });
  } catch (error) {
    console.error('[STICKER ERROR]:', error);
    repondre('Une erreur est survenue lors de la création du sticker');
  }
});

// Commande pour sticker recadré
zokou({
  nomCom: 'scrop',
  categorie: 'Conversion',
  reaction: '✂️',
  desc: 'Créer un sticker recadré'
}, async (dest, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, mtype } = context;

  try {
    if (!msgRepondu && !['imageMessage', 'videoMessage'].includes(mtype)) {
      return repondre('Répondez à une image/vidéo ou envoyez-en une avec la commande');
    }

    const media = msgRepondu ? { message: msgRepondu } : quotedMsg;
    const buffer = await downloadMediaMessage(media, 'buffer');

    await sendStickerMessage(dest, msg, buffer, { 
      type: StickerTypes.CROPPED 
    }, { quoted: quotedMsg });
  } catch (error) {
    console.error('[SCROP ERROR]:', error);
    repondre('Erreur lors de la création du sticker recadré');
  }
});

// Commande pour personnaliser les métadonnées du sticker
zokou({
  nomCom: 'take',
  categorie: 'Conversion',
  reaction: '🏷️',
  desc: 'Modifier le packname et l\'auteur du sticker',
  alias: ['steal']
}, async (dest, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, arg, nomAuteurMessage } = context;

  try {
    if (!msgRepondu && !['imageMessage', 'videoMessage', 'stickerMessage'].includes(mtype)) {
      return repondre('Répondez à un média avec la commande');
    }

    const media = msgRepondu ? { message: msgRepondu } : quotedMsg;
    const buffer = await downloadMediaMessage(media, 'buffer');
    const packname = arg?.length > 0 ? arg.join(' ').trim() : nomAuteurMessage;

    await sendStickerMessage(dest, msg, buffer, {
      packname,
      quality: 100
    }, { quoted: quotedMsg });
  } catch (error) {
    console.error('[TAKE ERROR]:', error);
    repondre('Erreur lors de la modification du sticker');
  }
});

// Commande pour créer un sticker avec texte
zokou({
  nomCom: 'ecrire',
  categorie: 'Conversion',
  reaction: '✍️',
  desc: 'Créer un sticker avec texte sur image'
}, async (dest, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre, arg } = context;

  try {
    if (!msgRepondu || !msgRepondu.imageMessage) {
      return repondre('Répondez à une image avec la commande');
    }

    if (!arg || arg.length === 0) {
      return repondre('Veuillez ajouter du texte');
    }

    const text = arg.join(' ');
    const tempFile = path.join(__dirname, 'temp_img.jpg');

    await withTempFile(tempFile, async () => {
      await quotedMsg.downloadAndSaveMediaMessage(msgRepondu.imageMessage, tempFile);
      
      // Utilisation de sharp pour optimiser la mémoire
      const processedImage = await sharp(tempFile)
        .resize(512, 512, { fit: 'inside' })
        .toBuffer();

      const form = new FormData();
      form.append('image', processedImage, { filename: 'image.jpg' });

      const response = await axios.post('https://api.imgur.com/3/image', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Client-ID b40a1820d63cd4e`
        },
        maxBodyLength: 10 * 1024 * 1024 // 10MB max
      });

      const imageUrl = response.data.data.link;
      const memeUrl = `https://api.memegen.link/images/custom/_/${encodeURIComponent(text)}.png?background=${imageUrl}`;

      await sendStickerMessage(dest, msg, { url: memeUrl }, {}, { quoted: quotedMsg });
    });
  } catch (error) {
    console.error('[ECRIRE ERROR]:', error);
    repondre('Erreur lors de la création du sticker avec texte');
  }
});

// Commande pour convertir un sticker en image
zokou({
  nomCom: 'photo',
  categorie: 'Conversion',
  reaction: '🖼️',
  desc: 'Convertir un sticker en image'
}, async (dest, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre } = context;

  try {
    if (!msgRepondu || !msgRepondu.stickerMessage) {
      return repondre('Répondez à un sticker');
    }

    const tempInput = path.join(__dirname, 'temp_sticker.webp');
    const tempOutput = path.join(__dirname, `sticker_${Date.now()}.png`);

    await withTempFile(tempInput, async () => {
      await withTempFile(tempOutput, async () => {
        await quotedMsg.downloadAndSaveMediaMessage(msgRepondu.stickerMessage, tempInput);
        
        // Conversion avec sharp (plus efficace que exec + ffmpeg)
        await sharp(tempInput)
          .toFormat('png')
          .toFile(tempOutput);

        const imageBuffer = fs.readFileSync(tempOutput);
        await dest.sendMessage(msg.key.remoteJid, { 
          image: imageBuffer 
        }, { quoted: quotedMsg });
      });
    });
  } catch (error) {
    console.error('[PHOTO ERROR]:', error);
    repondre('Erreur lors de la conversion du sticker en image');
  }
});

// Commande pour obtenir l'URL d'un média
zokou({
  nomCom: 'url',
  categorie: 'Conversion',
  reaction: '🔗',
  desc: 'Obtenir l\'URL d\'un média'
}, async (dest, msg, context) => {
  const { ms: quotedMsg, msgRepondu, repondre } = context;

  try {
    if (!msgRepondu) {
      return repondre('Répondez à un média');
    }

    const mediaTypes = ['imageMessage', 'videoMessage', 'stickerMessage'];
    const mediaType = mediaTypes.find(type => msgRepondu[type]);

    if (!mediaType) {
      return repondre('Type de média non supporté');
    }

    const tempFile = path.join(__dirname, `temp_${Date.now()}.${mediaType === 'videoMessage' ? 'mp4' : 'webp'}`);

    await withTempFile(tempFile, async () => {
      await quotedMsg.downloadAndSaveMediaMessage(msgRepondu[mediaType], tempFile);
      const fileUrl = await uploadToCatbox(tempFile);
      repondre(`URL du média: ${fileUrl}`);
    });
  } catch (error) {
    console.error('[URL ERROR]:', error);
    repondre('Erreur lors de la génération du lien');
  }
});
