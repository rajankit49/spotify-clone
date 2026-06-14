const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const musicModel = require('../models/music.model');
const { getSpotifyTrack, getSpotifyArtist, getSpotifyRecommendations } = require('../services/spotify.service');

// Helper to resolve Saavn Artist to a local User document
async function resolveLocalArtist(saavnArtId) {
    const saavnId = saavnArtId.replace('saavn_art_', '');
    let artist = await userModel.findOne({ email: `artist_${saavnId}@saavn.com` });
    if (artist) return artist;

    try {
        const res = await fetch(`https://saavn.sumit.co/api/artists?id=${saavnId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
                const artistName = data.data.name;
                artist = await userModel.findOne({ username: artistName, role: 'artist' });
                if (!artist) {
                    artist = await userModel.create({
                        username: artistName,
                        email: `artist_${saavnId}@saavn.com`,
                        password: "dummy_password_hash",
                        role: 'artist'
                    });
                }
            }
        }
    } catch (err) {
        console.error("Error resolving Saavn artist:", err.message);
    }
    return artist;
}

// Helper to resolve Saavn Song to a local Music document
async function resolveLocalMusic(saavnSongId) {
    const saavnId = saavnSongId.replace('saavn_', '');
    let music = await musicModel.findOne({ saavnId: saavnId });
    if (!music) {
        try {
            const res = await fetch(`https://saavn.sumit.co/api/songs?ids=${saavnId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data?.[0]) {
                    const track = data.data[0];
                    const streamLink = track.downloadUrl.find(d => d.quality === '160kbps')?.url || track.downloadUrl[track.downloadUrl.length - 1]?.url;
                    const artistName = track.artists?.primary?.[0]?.name || "Unknown Artist";
                    const artistId = track.artists?.primary?.[0]?.id || "unknown";
                    
                    const localArtist = await resolveLocalArtist("saavn_art_" + artistId);
                    if (!localArtist) return null;
                    
                    music = await musicModel.create({
                        title: track.name,
                        uri: streamLink,
                        coverImage: track.image[track.image.length - 1]?.url || "",
                        artist: localArtist._id,
                        saavnId: saavnId
                    });
                }
            }
        } catch (err) {
            console.error("Error resolving Saavn music:", err.message);
        }
    }
    return music;
}

// Helper to resolve Spotify Artist to a local User document
async function resolveLocalSpotifyArtist(spotifyArtId) {
    const spotifyId = spotifyArtId.replace('spotify_art_', '');
    let artist = await userModel.findOne({ email: `artist_${spotifyId}@spotify.com` });
    if (artist) return artist;

    try {
        const artistData = await getSpotifyArtist(spotifyId);
        if (artistData) {
            const artistName = artistData.name;
            // Check if user already exists with that username and role
            artist = await userModel.findOne({ username: artistName, role: 'artist' });
            if (!artist) {
                artist = await userModel.create({
                    username: artistName,
                    email: `artist_${spotifyId}@spotify.com`,
                    password: "dummy_password_hash",
                    role: 'artist'
                });
            }
        }
    } catch (err) {
        console.error("Error resolving Spotify artist:", err.message);
    }
    return artist;
}

// Helper to resolve Spotify Song to a local Music document
async function resolveLocalSpotifyMusic(spotifySongId) {
    const spotifyId = spotifySongId.replace('spotify_', '');
    let music = await musicModel.findOne({ spotifyId: spotifyId });
    if (!music) {
        try {
            const track = await getSpotifyTrack(spotifyId);
            if (track) {
                const streamLink = track.preview_url;
                const artistName = track.artists?.[0]?.name || "Unknown Artist";
                const artistId = track.artists?.[0]?.id || "unknown";
                
                const localArtist = await resolveLocalSpotifyArtist("spotify_art_" + artistId);
                if (!localArtist) return null;
                
                music = await musicModel.create({
                    title: track.name,
                    uri: streamLink,
                    coverImage: track.album.images?.[0]?.url || "",
                    artist: localArtist._id,
                    spotifyId: spotifyId
                });
            }
        } catch (err) {
            console.error("Error resolving Spotify music:", err.message);
        }
    }
    return music;
}

async function toggleLikeMusic(req, res) {
    try {
        let { musicId } = req.params;
        const user = await userModel.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Resolve external JioSaavn or Spotify song IDs to a local MongoDB music document
        if (!mongoose.Types.ObjectId.isValid(musicId)) {
            if (musicId.startsWith('saavn_')) {
                const music = await resolveLocalMusic(musicId);
                if (!music) return res.status(404).json({ message: "Song not found" });
                musicId = music._id.toString();
            } else if (musicId.startsWith('spotify_')) {
                const music = await resolveLocalSpotifyMusic(musicId);
                if (!music) return res.status(404).json({ message: "Song not found" });
                musicId = music._id.toString();
            } else {
                return res.status(400).json({ message: "Invalid music ID" });
            }
        }

        const likedIndex = user.likedSongs.findIndex(id => id.toString() === musicId);
        if (likedIndex === -1) {
            // Add to likes
            user.likedSongs.push(musicId);
        } else {
            // Remove from likes
            user.likedSongs.splice(likedIndex, 1);
        }

        await user.save();

        res.status(200).json({
            message: likedIndex === -1 ? "Song liked" : "Song unliked",
            likedSongs: user.likedSongs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getLikedSongs(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate({
            path: 'likedSongs',
            populate: { path: 'artist', select: 'username email' }
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ likedSongs: user.likedSongs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function toggleFollowUser(req, res) {
    try {
        let { targetUserId } = req.params;
        const userId = req.user.id;

        // Resolve external JioSaavn or Spotify artist IDs to a local MongoDB user document
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            if (targetUserId.startsWith('saavn_art_')) {
                const artist = await resolveLocalArtist(targetUserId);
                if (!artist) return res.status(404).json({ message: "Artist not found" });
                targetUserId = artist._id.toString();
            } else if (targetUserId.startsWith('spotify_art_')) {
                const artist = await resolveLocalSpotifyArtist(targetUserId);
                if (!artist) return res.status(404).json({ message: "Artist not found" });
                targetUserId = artist._id.toString();
            } else {
                return res.status(400).json({ message: "Invalid user ID" });
            }
        }

        if (userId === targetUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const user = await userModel.findById(userId);
        const targetUser = await userModel.findById(targetUserId);

        if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

        const followingIndex = user.following.findIndex(id => id.toString() === targetUserId);

        if (followingIndex === -1) {
            // Follow
            user.following.push(targetUserId);
            targetUser.followers.push(userId);
        } else {
            // Unfollow
            user.following.splice(followingIndex, 1);
            
            const followerIndex = targetUser.followers.findIndex(id => id.toString() === userId);
            if (followerIndex !== -1) {
                targetUser.followers.splice(followerIndex, 1);
            }
        }

        await user.save();
        await targetUser.save();

        res.status(200).json({
            message: followingIndex === -1 ? "User followed" : "User unfollowed",
            following: user.following
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function recordHistory(req, res) {
    try {
        let { musicId } = req.params;
        const user = await userModel.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Resolve external JioSaavn or Spotify song IDs to a local MongoDB music document
        if (!mongoose.Types.ObjectId.isValid(musicId)) {
            if (musicId.startsWith('saavn_')) {
                const music = await resolveLocalMusic(musicId);
                if (!music) return res.status(404).json({ message: "Song not found" });
                musicId = music._id.toString();
            } else if (musicId.startsWith('spotify_')) {
                const music = await resolveLocalSpotifyMusic(musicId);
                if (!music) return res.status(404).json({ message: "Song not found" });
                musicId = music._id.toString();
            } else {
                return res.status(400).json({ message: "Invalid music ID" });
            }
        }

        // Remove if already in history so we can move it to the front
        const index = user.history.findIndex(id => id.toString() === musicId);
        if (index !== -1) {
            user.history.splice(index, 1);
        }

        // Add to the beginning of the history
        user.history.unshift(musicId);

        // Keep only the last 50 songs in history to save space
        if (user.history.length > 50) {
            user.history.pop();
        }

        await user.save();

        res.status(200).json({ message: "History updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getHistory(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate({
            path: 'history',
            populate: { path: 'artist', select: 'username email' }
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ history: user.history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getUserProfile(req, res) {
    try {
        const { userId } = req.params;
        let targetId = userId;

        // Resolve external JioSaavn or Spotify artist IDs to a local MongoDB user document
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            if (userId.startsWith('saavn_art_')) {
                const artist = await resolveLocalArtist(userId);
                if (!artist) return res.status(404).json({ message: "Artist not found" });
                targetId = artist._id.toString();
            } else if (userId.startsWith('spotify_art_')) {
                const artist = await resolveLocalSpotifyArtist(userId);
                if (!artist) return res.status(404).json({ message: "Artist not found" });
                targetId = artist._id.toString();
            } else {
                return res.status(400).json({ message: "Invalid user ID" });
            }
        }

        const user = await userModel.findById(targetId)
            .select('-password')
            .populate('followers', 'username email')
            .populate('following', 'username email');
            
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getRecommendations(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate('likedSongs').populate('history');
        if (!user) return res.status(404).json({ message: "User not found" });

        const localSeeds = [];
        const spotifySeeds = [];

        user.history.forEach(track => {
            if (track.spotifyId) {
                spotifySeeds.push(track.spotifyId);
            } else {
                localSeeds.push(track._id);
            }
        });

        user.likedSongs.forEach(track => {
            if (track.spotifyId) {
                spotifySeeds.push(track.spotifyId);
            } else {
                localSeeds.push(track._id);
            }
        });

        const uniqueSpotifySeeds = [...new Set(spotifySeeds)].slice(0, 5);
        let recommendedMusic = [];

        if (uniqueSpotifySeeds.length > 0) {
            const spotifyRecs = await getSpotifyRecommendations(uniqueSpotifySeeds, 10);
            if (spotifyRecs && spotifyRecs.tracks) {
                const mappedSpotify = spotifyRecs.tracks
                    .filter(track => track.preview_url)
                    .map(track => ({
                        _id: "spotify_" + track.id,
                        title: track.name,
                        uri: track.preview_url,
                        coverImage: track.album.images[0]?.url || "",
                        artist: {
                            _id: "spotify_art_" + track.artists[0]?.id,
                            username: track.artists[0]?.name
                        },
                        duration: Math.round(track.duration_ms / 1000)
                    }));
                recommendedMusic.push(...mappedSpotify);
            }
        }

        const listenedSongIds = new Set([
            ...user.history.map(t => t._id.toString()),
            ...user.likedSongs.map(t => t._id.toString())
        ]);

        const favoriteArtistIds = [
            ...new Set([
                ...user.history.map(t => t.artist?.toString()).filter(Boolean),
                ...user.likedSongs.map(t => t.artist?.toString()).filter(Boolean)
            ])
        ];

        let localRecs = [];
        if (favoriteArtistIds.length > 0) {
            localRecs = await musicModel.find({
                artist: { $in: favoriteArtistIds },
                _id: { $nin: Array.from(listenedSongIds).filter(id => mongoose.Types.ObjectId.isValid(id)) }
            }).limit(10).populate('artist', 'username');
        }

        if (recommendedMusic.length + localRecs.length < 6) {
            const extraRecs = await musicModel.find({
                _id: { $nin: Array.from(listenedSongIds).filter(id => mongoose.Types.ObjectId.isValid(id)) }
            }).limit(10).populate('artist', 'username');
            localRecs.push(...extraRecs);
        }

        recommendedMusic.push(...localRecs);

        const seenIds = new Set();
        const finalRecommendations = recommendedMusic.filter(song => {
            const idStr = song._id.toString();
            if (seenIds.has(idStr)) return false;
            seenIds.add(idStr);
            return true;
        }).slice(0, 15);

        res.status(200).json({ recommendations: finalRecommendations });
    } catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { toggleLikeMusic, getLikedSongs, toggleFollowUser, recordHistory, getHistory, getUserProfile, getRecommendations };
