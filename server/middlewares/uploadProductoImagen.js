const fs = require('fs');
const path = require('path');
const multer = require('multer');

const directorioUploads = path.join(__dirname, '..', 'uploads', 'productos');
fs.mkdirSync(directorioUploads, { recursive: true });

const mimeTypesPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, directorioUploads);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const nombreSeguro = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, nombreSeguro);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!mimeTypesPermitidos.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imagenes JPG, PNG o WEBP'));
    }
    cb(null, true);
  },
});

const uploadProductoImagen = (req, res, next) => {
  const handler = upload.single('imagen');

  handler(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'La imagen no puede exceder 2MB' });
    }

    return res.status(400).json({ mensaje: error.message || 'Error al subir la imagen' });
  });
};

module.exports = { uploadProductoImagen };
