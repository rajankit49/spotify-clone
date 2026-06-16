const mongoose = require('mongoose');
const musicModel = require('../models/music.model')
const albumModel = require('../models/album.model');
const {uploadFile}= require('../services/storage.service');
const { getSpotifyAlbum } = require('../services/spotify.service');
async function createMusic(req, res) {
    try {
        const { title, albumId } = req.body;
        const file = req.file;

        if (!req.file) return res.status(400).json({ message: "No music file provided" });
        const result = await uploadFile(file.buffer.toString('base64'), file.originalname);

        let coverImage = "";
        const titleLower = (title || "").toLowerCase();
        if (titleLower.includes("shiv") || titleLower.includes("guru") || titleLower.includes("mahadev")) {
            coverImage = "/shiva.png";
        }

        const music = await musicModel.create({
            uri: result.url,
            title,
            artist: req.user.id,
            coverImage,
        });

        if (albumId) {
            const album = await albumModel.findById(albumId);
            if (album) {
                album.musics.push(music._id);
                await album.save();
            }
        }

        res.status(201).json({
            message: "Music created successfully",
            music: {
                id: music._id,
                uri: music.uri,
                title: music.title,
                artist: music.artist,
                albumId: albumId || null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function createAlbum(req, res) {
    try {
        const { title, musics, coverImage } = req.body;

        const album = await albumModel.create({
            title,
            artist: req.user.id,
            musics: musics,
            coverImage: coverImage || "",
        });

        res.status(201).json({
            message: "Album created successfully",
            album: {
                id: album._id,
                title: album.title,
                artist: album.artist,
                musics: album.musics,
                coverImage: album.coverImage,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getAllMusics(req, res) {
    try {
        const music = await musicModel
            .find({ status: 'approved' })
            .limit(100)
            .populate("artist", "username email");

        res.status(200).json({
            message: "Music fetched successfully",
            musics: music,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getAllAlbums(req, res) {
    try {
        const album = await albumModel
            .find()
            .populate("artist", "username email");

        res.status(200).json({
            message: "Album fetched successfully",
            albums: album,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getAlbumById(req, res) {
    try {
        const albumId = req.params.albumId;

        // If it's a Spotify or JioSaavn Album ID (not a valid MongoDB ObjectId)
        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            if (albumId.startsWith('saavn_alb_')) {
                const saavnId = albumId.replace('saavn_alb_', '');
                try {
                    const saavnAlbumRes = await fetch(`https://saavn.sumit.co/api/albums?id=${saavnId}`);
                    if (saavnAlbumRes.ok) {
                        const saavnAlbumData = await saavnAlbumRes.json();
                        if (saavnAlbumData.success && saavnAlbumData.data) {
                            const spotifyAlbum = saavnAlbumData.data;
                            const mappedAlbum = {
                                _id: 'saavn_alb_' + spotifyAlbum.id,
                                title: spotifyAlbum.name,
                                coverImage: spotifyAlbum.image[spotifyAlbum.image.length - 1]?.url || "",
                                artist: {
                                    _id: 'saavn_art_' + (spotifyAlbum.artists?.primary?.[0]?.id || "unknown"),
                                    username: spotifyAlbum.artists?.primary?.[0]?.name || "Unknown Artist",
                                    email: ""
                                },
                                musics: (spotifyAlbum.songs || []).map((track) => {
                                    let streamLink = track.downloadUrl.find(d => d.quality === '160kbps')?.url || track.downloadUrl[track.downloadUrl.length - 1]?.url;
                                    if (streamLink && streamLink.startsWith('http://')) {
                                        streamLink = streamLink.replace('http://', 'https://');
                                    }
                                    return {
                                        _id: "saavn_" + track.id,
                                        title: track.name,
                                        uri: streamLink,
                                        coverImage: track.image[track.image.length - 1]?.url || "",
                                        duration: track.duration,
                                        artist: {
                                            _id: "saavn_art_" + (track.artists.primary[0]?.id || "unknown"),
                                            username: track.artists.primary[0]?.name || "Unknown Artist"
                                        }
                                    };
                                })
                            };
                            return res.status(200).json({
                                message: "Saavn Album fetched successfully",
                                album: mappedAlbum
                            });
                        }
                    }
                } catch (saavnErr) {
                    console.error("Saavn fallback album fetch error:", saavnErr.message);
                }
                return res.status(404).json({ message: "Album not found in JioSaavn" });
            }

            let spotifyId = albumId;
            if (albumId.startsWith('spotify_alb_')) {
                spotifyId = albumId.replace('spotify_alb_', '');
            }
            const spotifyAlbum = await getSpotifyAlbum(spotifyId);
            if (!spotifyAlbum) {
                return res.status(404).json({ message: "Album not found in Spotify" });
            }
            const mappedAlbum = {
                _id: 'spotify_alb_' + spotifyAlbum.id,
                title: spotifyAlbum.name,
                coverImage: spotifyAlbum.images[0]?.url || "",
                artist: {
                    _id: 'spotify_art_' + spotifyAlbum.artists[0]?.id,
                    username: spotifyAlbum.artists[0]?.name,
                    email: ""
                },
                musics: spotifyAlbum.tracks.items
                    .filter(track => track.preview_url)
                    .map((track) => ({
                        _id: 'spotify_' + track.id,
                        title: track.name,
                        uri: track.preview_url,
                        coverImage: spotifyAlbum.images[0]?.url || "",
                        duration: Math.round(track.duration_ms / 1000),
                        artist: {
                            _id: 'spotify_art_' + spotifyAlbum.artists[0]?.id,
                            username: spotifyAlbum.artists[0]?.name
                        }
                    }))
            };
            return res.status(200).json({
                message: "Spotify Album fetched successfully",
                album: mappedAlbum
            });
        }

        const album = await albumModel.findById(albumId)
            .populate("artist", "username email")
            .populate({
                path: 'musics',
                populate: { path: 'artist', select: 'username email' }
            });

        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        return res.status(200).json({
            message: "Album fetched successfully",
            album: album,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function addMusicToAlbum(req, res) {
    try {
        const { albumId, musicId } = req.params;

        const album = await albumModel.findById(albumId);
        if (!album) return res.status(404).json({ message: "Album not found" });

        if (!album.musics.includes(musicId)) {
            album.musics.push(musicId);
            await album.save();
        }

        return res.status(200).json({
            message: "Music added to album successfully",
            album
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getPendingMusics(req, res) {
    try {
        const music = await musicModel
            .find({ status: 'pending' })
            .populate("artist", "username email");

        res.status(200).json({
            message: "Pending music fetched successfully",
            musics: music,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function approveMusic(req, res) {
    try {
        const { musicId } = req.params;
        const music = await musicModel.findByIdAndUpdate(musicId, { status: 'approved' }, { new: true });
        if (!music) {
            return res.status(404).json({ message: "Music not found" });
        }
        res.status(200).json({ message: "Music approved successfully", music });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function rejectMusic(req, res) {
    try {
        const { musicId } = req.params;
        const music = await musicModel.findByIdAndDelete(musicId);
        if (!music) {
            return res.status(404).json({ message: "Music not found" });
        }
        res.status(200).json({ message: "Music rejected and deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { 
    createMusic, 
    createAlbum, 
    getAllMusics, 
    getAllAlbums, 
    getAlbumById, 
    addMusicToAlbum,
    getPendingMusics,
    approveMusic,
    rejectMusic
};
