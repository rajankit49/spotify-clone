const express = require('express');
const router = express.Router();
const { authUser } = require('../middlewares/auth.middleware');
const { 
    toggleLikeMusic, 
    getLikedSongs, 
    toggleFollowUser, 
    recordHistory, 
    getHistory,
    getUserProfile,
    getRecommendations
} = require('../controllers/userAction.controller');

// Likes
router.post('/like/:musicId', authUser, toggleLikeMusic);
router.get('/likes', authUser, getLikedSongs);

// Recommendations
router.get('/recommendations', authUser, getRecommendations);

// Follows
router.post('/follow/:targetUserId', authUser, toggleFollowUser);
router.get('/profile/:userId', authUser, getUserProfile);

// History
router.post('/history/:musicId', authUser, recordHistory);
router.get('/history', authUser, getHistory);

module.exports = router;
