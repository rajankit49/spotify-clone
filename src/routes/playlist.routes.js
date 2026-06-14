const express = require('express');
const router = express.Router();
const { authUser } = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
});

const { 
    createPlaylist, 
    addMusicToPlaylist, 
    removeMusicFromPlaylist, 
    getUserPlaylists, 
    getPlaylistById,
    updatePlaylist,
    addCollaborator,
    removeCollaborator
} = require('../controllers/playlist.controller');

// Create a new playlist
router.post('/', authUser, createPlaylist);

// Get all playlists for the logged-in user
router.get('/', authUser, getUserPlaylists);

// Get a specific playlist
router.get('/:playlistId', authUser, getPlaylistById);

// Update a playlist (including cover image)
router.put('/:playlistId', authUser, upload.single('coverImage'), updatePlaylist);

// Add music to playlist
router.post('/:playlistId/music/:musicId', authUser, addMusicToPlaylist);

// Remove music from playlist
router.delete('/:playlistId/music/:musicId', authUser, removeMusicFromPlaylist);

// Add collaborator to playlist
router.post('/:playlistId/collaborator', authUser, addCollaborator);

// Remove collaborator from playlist
router.post('/:playlistId/collaborator/remove', authUser, removeCollaborator);

module.exports = router;
