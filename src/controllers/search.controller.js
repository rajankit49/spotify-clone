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

        // ─────────────────────────────────────────────────────────────
        // STEP 1 – Build fuzzy regex patterns from the user's query
        //   1. Full query phrase        → /nimiya k dadh/i
        //   2. Each word separately     → /nimiya/i, /dadh/i
        //   3. 1-char deletions per word → catches typos like "nimia"
        // ─────────────────────────────────────────────────────────────
        const buildFuzzyPatterns = (query) => {
            const patterns = new Set();
            const clean = query.trim();

            patterns.add(new RegExp(clean, 'i'));

            const words = clean.split(/\s+/).filter(w => w.length >= 2);
            words.forEach(w => patterns.add(new RegExp(w, 'i')));

            words.forEach(word => {
                if (word.length >= 4) {
                    for (let i = 0; i < word.length; i++) {
                        const variant = word.slice(0, i) + word.slice(i + 1);
                        if (variant.length >= 3) patterns.add(new RegExp(variant, 'i'));
                    }
                }
            });

            return Array.from(patterns);
        };

        const fuzzyPatterns   = buildFuzzyPatterns(q);
        const titleOrConds    = fuzzyPatterns.map(r => ({ title: r }));
        const artistOrConds   = fuzzyPatterns.map(r => ({ username: r, role: 'artist' }));

        const matchingArtists    = await userModel.find({ $or: artistOrConds });
        const matchingArtistIds  = matchingArtists.map(a => a._id);

        // ─────────────────────────────────────────────────────────────
        // STEP 2 – Fetch from ALL sources in parallel
        //   • Local MongoDB  (approved songs uploaded by artists)
        //   • JioSaavn API   (full-length Hindi/Bhojpuri/regional songs)
        //   • Spotify API    (30-second previews, global catalogue)
        //   Limits are HIGH so every version / artist is returned.
        // ─────────────────────────────────────────────────────────────
        const saavnBase = `https://saavn.sumit.co/api/search`;

        const [musics, albums, playlists, spotifyResults, saavnSongRes, saavnAlbumRes] = await Promise.all([
            musicModel.find({
                status: 'approved',
                $or: [
                    ...titleOrConds,
                    ...(matchingArtistIds.length > 0 ? [{ artist: { $in: matchingArtistIds } }] : [])
                ]
            }).limit(50).populate('artist', 'username'),

            albumModel.find({
                $or: [
                    ...titleOrConds,
                    ...(matchingArtistIds.length > 0 ? [{ artist: { $in: matchingArtistIds } }] : [])
                ]
            }).limit(50).populate('artist', 'username'),

            playlistModel.find({ $or: titleOrConds, isPublic: true })
                .limit(20).populate('owner', 'username'),

            searchSpotify(q, 20).catch(() => null),

            // Ask JioSaavn for up to 20 song results so all versions show up
            fetch(`${saavnBase}/songs?query=${encodeURIComponent(q)}&limit=20`).catch(() => null),
            fetch(`${saavnBase}/albums?query=${encodeURIComponent(q)}&limit=20`).catch(() => null)
        ]);

        let externalMusics = [];
        let externalAlbums = [];

        // ── Spotify tracks (preview URLs only) ──────────────────────
        if (spotifyResults?.tracks?.items) {
            externalMusics.push(...spotifyResults.tracks.items
                .filter(t => t.preview_url)
                .map(t => ({
                    _id: 'spotify_' + t.id,
                    title: t.name,
                    uri: t.preview_url,
                    coverImage: t.album.images[0]?.url || '',
                    artist: {
                        _id: 'spotify_art_' + t.artists[0]?.id,
                        username: t.artists[0]?.name
                    },
                    duration: Math.round(t.duration_ms / 1000),
                    source: 'spotify'
                }))
            );

            externalAlbums.push(...(spotifyResults.albums?.items?.map(a => ({
                _id: 'spotify_alb_' + a.id,
                title: a.name,
                coverImage: a.images[0]?.url || '',
                artist: { _id: 'spotify_art_' + a.artists[0]?.id, username: a.artists[0]?.name }
            })) || []));
        }

        // ── JioSaavn songs (full audio) ──────────────────────────────
        if (saavnSongRes?.ok) {
            try {
                const sd = await saavnSongRes.json();
                if (sd.success && sd.data?.results) {
                    externalMusics.push(...sd.data.results.map(t => {
                        const streamUrl =
                            t.downloadUrl.find(d => d.quality === '160kbps')?.url ||
                            t.downloadUrl[t.downloadUrl.length - 1]?.url;
                        return {
                            _id: 'saavn_' + t.id,
                            title: t.name,
                            uri: streamUrl,
                            coverImage: t.image[t.image.length - 1]?.url || '',
                            artist: {
                                _id: 'saavn_art_' + (t.artists.primary[0]?.id || 'unknown'),
                                username: t.artists.primary[0]?.name || 'Unknown Artist'
                            },
                            duration: t.duration,
                            source: 'jiosaavn'
                        };
                    }));
                }
            } catch (e) { console.error('Saavn songs parse error:', e.message); }
        }

        // ── JioSaavn albums ──────────────────────────────────────────
        if (saavnAlbumRes?.ok) {
            try {
                const ad = await saavnAlbumRes.json();
                if (ad.success && ad.data?.results) {
                    externalAlbums.push(...ad.data.results.map(a => ({
                        _id: 'saavn_alb_' + a.id,
                        title: a.name,
                        coverImage: a.image[a.image.length - 1]?.url || '',
                        artist: {
                            _id: 'saavn_art_' + (a.artists?.primary?.[0]?.id || 'unknown'),
                            username: a.artists?.primary?.[0]?.name || 'Unknown Artist'
                        }
                    })));
                }
            } catch (e) { console.error('Saavn albums parse error:', e.message); }
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 3 – Deduplicate
        //   Rule: same title + same artist from multiple sources = keep only one
        //         same title + DIFFERENT artist              = KEEP ALL  ✅
        //   We normalize text before comparing so encoding quirks don't
        //   falsely merge genuinely different songs.
        // ─────────────────────────────────────────────────────────────
        const normalize = (str) =>
            (str || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')   // strip accents
                .replace(/[^a-z0-9\s]/g, '')       // strip special chars
                .replace(/\s+/g, ' ')
                .trim();

        const dedupe = (list) => {
            const seen = new Set();
            return list.filter(item => {
                const key = `${normalize(item.title)}||${normalize(item.artist?.username)}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        // ─────────────────────────────────────────────────────────────
        // STEP 4 – Merge & sort
        //   Local DB songs first (artist uploaded them intentionally),
        //   then external. Within each group, sort alphabetically by
        //   title so all versions of the same song appear together.
        // ─────────────────────────────────────────────────────────────
        const allMusics  = dedupe([...musics, ...externalMusics]);
        const allAlbums  = dedupe([...albums, ...externalAlbums]);

        // Sort: group same-title songs together, then by artist name
        const sortByTitleArtist = (a, b) => {
            const ta = normalize(a.title);
            const tb = normalize(b.title);
            if (ta < tb) return -1;
            if (ta > tb) return 1;
            // Same title → sort by artist so versions are side-by-side
            const aa = normalize(a.artist?.username);
            const ab = normalize(b.artist?.username);
            return aa < ab ? -1 : aa > ab ? 1 : 0;
        };

        allMusics.sort(sortByTitleArtist);
        allAlbums.sort(sortByTitleArtist);

        res.status(200).json({
            results: {
                musics:    allMusics,
                albums:    allAlbums,
                playlists: playlists
            }
        });

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { globalSearch };
