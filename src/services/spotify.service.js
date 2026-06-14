let accessToken = null;
let tokenExpiresAt = null;

async function getSpotifyAccessToken() {
    // If token is still valid, return it
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn("Spotify credentials are not configured in your .env file. API calls will return empty results.");
        return null;
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Spotify token request failed: ${response.status} ${errText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        // Expires in data.expires_in seconds. Subtract 5 mins buffer.
        tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
        
        console.log("Spotify access token refreshed successfully.");
        return accessToken;
    } catch (error) {
        console.error("Error fetching Spotify access token:", error.message);
        return null;
    }
}

async function searchSpotify(query, limit = 20) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return null;

        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album,artist&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Spotify search failed: ${response.status} ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error searching Spotify API:", error.message);
        return null;
    }
}

async function getSpotifyAlbum(albumId) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return null;

        const url = `https://api.spotify.com/v1/albums/${albumId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Spotify album fetch failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching Spotify album ${albumId}:`, error.message);
        return null;
    }
}

async function getSpotifyArtist(artistId) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return null;

        const url = `https://api.spotify.com/v1/artists/${artistId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Spotify artist fetch failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching Spotify artist ${artistId}:`, error.message);
        return null;
    }
}

async function getSpotifyTrack(trackId) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return null;

        const url = `https://api.spotify.com/v1/tracks/${trackId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Spotify track fetch failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching Spotify track ${trackId}:`, error.message);
        return null;
    }
}

async function getSpotifyRecommendations(seedTracks, limit = 10) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return null;

        const url = `https://api.spotify.com/v1/recommendations?seed_tracks=${encodeURIComponent(seedTracks.join(','))}&limit=${limit}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Spotify recommendations failed: ${response.status} ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching Spotify recommendations:", error.message);
        return null;
    }
}

module.exports = {
    searchSpotify,
    getSpotifyAlbum,
    getSpotifyArtist,
    getSpotifyTrack,
    getSpotifyRecommendations
};
