const express = require('express');
const musicController = require("../controllers/music.controller")
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimetypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp3', 'audio/mp4'];
        if (allowedMimetypes.includes(file.mimetype) || file.originalname.endsWith('.mp3') || file.originalname.endsWith('.wav')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type! Only MP3, WAV, and M4A audio files are allowed.'), false);
        }
    }
});

// Wrapper middleware to catch and return 400 Bad Request on upload error instead of crashing
const uploadSingleMusic = (req, res, next) => {
    upload.single("music")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Upload error: File size too large (max 15MB)" });
            }
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

const router = express.Router();


router.post("/upload",authMiddleware.authArtist, uploadSingleMusic, musicController.createMusic)
router.post("/album",authMiddleware.authArtist, musicController.createAlbum)

router.get("/", authMiddleware.authUser, musicController.getAllMusics)
router.get("/albums", authMiddleware.authUser, musicController.getAllAlbums)
router.get("/albums/:albumId", authMiddleware.authUser, musicController.getAlbumById)

module.exports = router;
