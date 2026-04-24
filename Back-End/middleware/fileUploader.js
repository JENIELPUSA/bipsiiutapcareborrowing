const multer = require("multer");
const path = require("path");

// --- BAGUHIN ITO: Gamitin ang memoryStorage imbes na diskStorage ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Pinanatili ang iyong logic para sa allowed extensions
    const allowedExts = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif|svg|webp|jfif)$/i;
    if (!allowedExts.test(path.extname(file.originalname).toLowerCase())) {
        return cb(new Error("Only document and image files are allowed (.pdf, .docx, .jpg, .png, etc)"), false);
    }
    cb(null, true);
};

const upload = multer({
    storage, // Gagamit na ngayon ng buffer memory
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;