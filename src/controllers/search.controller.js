const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const playlistModel = require('../models/playlist.model');
const userModel = require('../models/user.model');
const { searchSpotify } = require('../services/spotify.service');

async function globalSearch(req, res) {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: "Search query 'q' is required" });
        }

        // Case-insensitive regex search for local DB
        const regex = new RegExp(q, 'i');

        // Find artists matching the search query
        const matchingArtists = await userModel.find({ username: regex, role: 'artist' });
        const matchingArtistIds = matchingArtists.map(artist => artist._id);

        // Execute local searches, Spotify search, and JioSaavn search in parallel
        const [musics, albums, playlists, spotifyResults, saavnSongRes, saavnAlbumRes] = await Promise.all([
            musicModel.find({
                $or: [
                    { title: regex },
                    { artist: { $in: matchingArtistIds } }
                ]
            }).limit(10).populate('artist', 'username'),
            albumModel.find({
                $or: [
                    { title: regex },
                    { artist: { $in: matchingArtistIds } }
                ]
            }).limit(10).populate('artist', 'username'),
            playlistModel.find({ title: regex, isPublic: true }).limit(10).populate('owner', 'username'),
            searchSpotify(q, 15).catch(() => null),
            fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(q)}`).catch(() => null),
            fetch(`https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(q)}`).catch(() => null)
        ]);

        let externalMusics = [];
        let externalAlbums = [];

        // 1. Process Spotify tracks (only those with preview URLs)
        if (spotifyResults && spotifyResults.tracks?.items) {
            const spotifyTracks = spotifyResults.tracks.items
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
            externalMusics.push(...spotifyTracks);

            const spotifyAlbs = spotifyResults.albums?.items?.map(album => ({
                _id: "spotify_alb_" + album.id,
                title: album.name,
                coverImage: album.images[0]?.url || "",
                artist: {
                    _id: "spotify_art_" + album.artists[0]?.id,
                    username: album.artists[0]?.name
                }
            })) || [];
            externalAlbums.push(...spotifyAlbs);
        }

        // 2. Process JioSaavn tracks (full-length audio)
        if (saavnSongRes && saavnSongRes.ok) {
            try {
                const saavnSongData = await saavnSongRes.json();
                if (saavnSongData.success && saavnSongData.data?.results) {
                    const saavnTracks = saavnSongData.data.results.map(track => {
                        const streamLink = track.downloadUrl.find(d => d.quality === '160kbps')?.url || track.downloadUrl[track.downloadUrl.length - 1]?.url;
                        return {
                            _id: "saavn_" + track.id,
                            title: track.name,
                            uri: streamLink,
                            coverImage: track.image[track.image.length - 1]?.url || "",
                            artist: {
                                _id: "saavn_art_" + (track.artists.primary[0]?.id || "unknown"),
                                username: track.artists.primary[0]?.name || "Unknown Artist"
                            },
                            duration: track.duration
                        };
                    });
                    externalMusics.push(...saavnTracks);
                }
            } catch (saavnErr) {
                console.error("Saavn parsing error (songs):", saavnErr.message);
            }
        }

        // 3. Process JioSaavn albums
        if (saavnAlbumRes && saavnAlbumRes.ok) {
            try {
                const saavnAlbumData = await saavnAlbumRes.json();
                if (saavnAlbumData.success && saavnAlbumData.data?.results) {
                    const saavnAlbs = saavnAlbumData.data.results.map(album => ({
                        _id: "saavn_alb_" + album.id,
                        title: album.name,
                        coverImage: album.image[album.image.length - 1]?.url || "",
                        artist: {
                            _id: "saavn_art_" + (album.artists?.primary?.[0]?.id || "unknown"),
                            username: album.artists?.primary?.[0]?.name || "Unknown Artist"
                        }
                    }));
                    externalAlbums.push(...saavnAlbs);
                }
            } catch (saavnErr) {
                console.error("Saavn parsing error (albums):", saavnErr.message);
            }
        }

        // Deduplicate songs by title/artist to keep search clean
        const seenSongs = new Set();
        const mergedMusics = [...musics, ...externalMusics].filter(song => {
            const key = `${song.title.toLowerCase()}_${(song.artist?.username || '').toLowerCase()}`;
            if (seenSongs.has(key)) return false;
            seenSongs.add(key);
            return true;
        });

        // Deduplicate albums
        const seenAlbums = new Set();
        const mergedAlbums = [...albums, ...externalAlbums].filter(album => {
            const key = `${album.title.toLowerCase()}_${(album.artist?.username || '').toLowerCase()}`;
            if (seenAlbums.has(key)) return false;
            seenAlbums.add(key);
            return true;
        });

        res.status(200).json({
            results: {
                musics: mergedMusics,
                albums: mergedAlbums,
                playlists: playlists
            }
        });
    } catch (error) {
        console.error("Global search error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { globalSearch };
