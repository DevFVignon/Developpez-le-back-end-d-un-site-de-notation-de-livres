const multer = require('multer');
const sharp = require('sharp');
const path = require ('path');
const fs = require ('fs');

//dictionnaire pour générer l'extension du fichier image
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

//destination et nom du fichier
const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).single('image');

const resizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const name = path.parse(req.file.originalname).name.split(' ').join('_');
    const outputFilePath = path.join('images', `resized_${name}_${Date.now()}.webp`);

    // Redimensionner et convertir l'image en WebP avec Sharp
    await sharp(req.file.buffer)
      .resize({ width: 404, height: 510 })
      .toFormat('webp')
      .toFile(outputFilePath);

    // Mettre à jour les informations du fichier dans req.file
    req.file.path = outputFilePath;
    req.file.filename = path.basename(outputFilePath);

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  upload,
  resizeImage
};