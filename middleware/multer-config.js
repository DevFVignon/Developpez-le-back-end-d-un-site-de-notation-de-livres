const multer = require('multer');
const sharp = require('sharp');
const path = require ('path');
const fs = require ('fs');

//dictionnaire pour générer l'extension du fichier image
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jepg',
  'image/png': 'png'
};

//destination et nom du fichier
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

//on exporte la gestion de fichier storage ou on s'occupe simplement des 
//à chaque fois d'un fichier avec le champ de formulaire nommé 'image'.
module.exports = multer({storage: storage}).single('image');

module.exports.resizeImage = (req, res, next) => {
  if (!req.file){return next()}
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const outputFilePath = path.join('images', `resized_${fileName}`);

    //sharp pour redimensionner l'image qui est traité au niveau du path indiqué
    //puis on supprime le fichier qui était enr. avec storage pour le remplacer
    sharp(filePath)
    .resize({width: 404, heigh: 510})
    .toFile(outputFilePath)
    .then(()=>{
      fs.unlink(filePath, ()=>{
        req.file.path = outputFilePath;
        next();
      })
    })
    .catch((error)=>{console.log(error);
      return next();
    });
};