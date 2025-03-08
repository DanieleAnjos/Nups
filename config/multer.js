const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imagesDir = path.join(__dirname, '../uploads/images/');
const documentsDir = path.join(__dirname, '../uploads/documents/');
const arquivosDir = path.join(__dirname, '../uploads/arquivos/');


if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
}

if (!fs.existsSync(arquivosDir)) {
    fs.mkdirSync(arquivosDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const filetypesImages = /jpeg|jpg|png|gif/;
        const filetypesDocuments = /pdf|doc|docx|xlsx|txt/;

        const isImage = filetypesImages.test(path.extname(file.originalname).toLowerCase()) || filetypesImages.test(file.mimetype);
        const isDocument = filetypesDocuments.test(path.extname(file.originalname).toLowerCase()) || filetypesDocuments.test(file.mimetype);

        if (isImage) {
            cb(null, imagesDir); 
        } else if (isDocument) {
            cb(null, documentsDir); 
        } else {
            cb(new Error('Apenas arquivos de imagem (JPEG, PNG, GIF) e documentos (PDF, DOC, DOCX, XLSX, TXT) são permitidos!'));
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); 
    },
});

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

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, 
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
