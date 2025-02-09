const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Verifica se os diretórios 'uploads/images' e 'uploads/documents' existem, se não, cria
const imagesDir = path.join(__dirname, '../uploads/images/');
const documentsDir = path.join(__dirname, '../uploads/documents/');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Verifica se o arquivo é uma imagem ou um documento e define o diretório de destino
        const filetypesImages = /jpeg|jpg|png|gif/;
        const filetypesDocuments = /pdf|doc|docx|xlsx|txt/;

        const isImage = filetypesImages.test(path.extname(file.originalname).toLowerCase()) || filetypesImages.test(file.mimetype);
        const isDocument = filetypesDocuments.test(path.extname(file.originalname).toLowerCase()) || filetypesDocuments.test(file.mimetype);

        if (isImage) {
            cb(null, imagesDir); // Salva imagens na pasta 'uploads/images'
        } else if (isDocument) {
            cb(null, documentsDir); // Salva documentos na pasta 'uploads/documents'
        } else {
            cb(new Error('Apenas arquivos de imagem (JPEG, PNG, GIF) e documentos (PDF, DOC, DOCX, XLSX, TXT) são permitidos!'));
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Renomeia o arquivo para evitar conflitos
    },
});

// Filtro para aceitar apenas imagens e documentos
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xlsx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem (JPEG, PNG, GIF) e documentos (PDF, DOC, DOCX, XLSX, TXT) são permitidos!'));
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

module.exports = { upload, uploadErrorHandler };
