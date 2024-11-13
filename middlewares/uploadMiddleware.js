const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Renomear arquivo para evitar conflitos
    },
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; 
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem (JPEG, PNG, GIF) são permitidos!'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB
    fileFilter,
});

const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).send({ message: err.message });
    } else if (err) {
        return res.status(400).send({ message: err.message });
    }
    next();
};

module.exports = { upload, uploadErrorHandler };
