const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Verifica se o diretório 'uploads' existe, se não, cria
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configuração do armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Renomear arquivo para evitar conflitos
    },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Adicionando suporte a GIF
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem (JPEG, PNG, GIF) são permitidos!'));
    }
};

// Exportar o middleware configurado
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB
    fileFilter,
});

// Middleware para tratar erros de upload
const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).send({ message: err.message });
    } else if (err) {
        return res.status(400).send({ message: err.message });
    }
    next();
};

module.exports = { upload, uploadErrorHandler }; // Remova o ']' desnecessário
