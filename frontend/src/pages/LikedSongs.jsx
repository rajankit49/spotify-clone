import React, { useEffect, useState, useContext } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import api from '../services/api';
import { PlayerContext } from '../context/PlayerContext';
import '../styles/playlist.css';

const LikedSongs = () => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playQueue, currentSong, isPlaying, togglePlay, likedSongIds, toggleLike, isSongLiked } = useContext(PlayerContext);

  useEffect(() => {
    const fetchLiked = async () => {
      setLoading(true);
      try {
        const response = await api.get('/user/likes');
        if (response.data && response.data.likedSongs) {
          setLikedSongs(response.data.likedSongs);
        }
      } catch (error) {
        console.error('Error fetching liked songs:', error);
      }
      setLoading(false);
    };
    fetchLiked();
  }, [likedSongIds]); // Re-fetch or sync when likedSongIds updates

  const handlePlayAll = () => {
    if (!likedSongs.length) return;
    const isCurrentLikedPlaying = isPlaying && likedSongs.some(s => s._id === currentSong?._id || (s.uri && s.uri === currentSong?.uri));
    if (isCurrentLikedPlaying) {
      togglePlay();
    } else {
      playQueue(likedSongs, 0);
    }
  };

  const handleToggleLike = async (e, song) => {
    e.stopPropagation();
    await toggleLike(song);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '3:12'; // Default fallback
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Loading Liked Songs...</div>;

  const isCurrentLikedPlaying = isPlaying && likedSongs.some(s => s._id === currentSong?._id || (s.uri && s.uri === currentSong?.uri));

  return (
    <div className="playlist-container">
      {/* Hero Section */}
      <div 
        className="playlist-hero"
        style={{
          background: 'linear-gradient(135deg, #4020a0, #80c0a0)',
          minHeight: '280px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '24px',
          gap: '24px',
          position: 'relative'
        }}
      >
        <div 
          style={{
            width: '192px',
            height: '192px',
            background: 'linear-gradient(135deg, #4020a0, #80c0a0)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            borderRadius: '4px',
            boxShadow: '0 4px 60px rgba(0,0,0,0.5)',
            flexShrink: 0
          }}
        >
          <Heart size={80} fill="white" color="white" />
        </div>
        <div className="playlist-hero-info">
          <span className="playlist-hero-label">Playlist</span>
          <h1 className="playlist-hero-title">Liked Songs</h1>
          <p className="playlist-hero-meta">
            Your personal library · {likedSongs.length} songs
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="playlist-controls">
        <button className="playlist-play-btn" onClick={handlePlayAll} disabled={!likedSongs.length}>
          {isCurrentLikedPlaying
            ? <Pause size={24} fill="currentColor" />
            : <Play size={24} fill="currentColor" />
          }
        </button>
      </div>

      {/* Track List */}
      <div className="track-list">
        {likedSongs.length === 0 ? (
          <div className="empty-playlist-msg">
            <h3>Songs you like will appear here</h3>
            <p>Save songs by clicking the heart icon on the Home page or in the Player!</p>
          </div>
        ) : (
          <>
            <div className="track-list-header">
              <span>#</span>
              <span>Title</span>
              <span>Artist</span>
              <span>⏱</span>
              <span></span>
            </div>
            {likedSongs.map((song, index) => {
              const isActive = currentSong?._id === song._id || (currentSong?.uri && currentSong.uri === song.uri);
              return (
                <div
                  key={song._id}
                  className={`track-row ${isActive ? 'active' : ''}`}
                  onClick={() => playQueue(likedSongs, index)}
                >
                  <div style={{ position: 'relative', textAlign: 'center', width: '24px' }}>
                    <span className="track-num" style={{ opacity: isActive ? 0 : 1 }}>{index + 1}</span>
                    <span className="track-play-icon" style={{ opacity: isActive ? 1 : undefined }}>
                      {isActive && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </span>
                  </div>
                  <div className="track-info">
                    <span className="track-title" style={{ color: isActive ? 'var(--spotify-green)' : undefined }}>
                      {song.title}
                    </span>
                    <span className="track-artist-sub">{song.artist?.username || 'Unknown'}</span>
                  </div>
                  <span className="track-artist">{song.artist?.username || 'Unknown'}</span>
                  <span className="track-duration">{formatDuration(song.duration)}</span>
                  <button
                    className="control-btn"
                    onClick={(e) => handleToggleLike(e, song)}
                    title={isSongLiked(song) ? "Remove from Liked Songs" : "Add to Liked Songs"}
                    style={{ color: isSongLiked(song) ? 'var(--spotify-green)' : 'var(--text-subdued)', opacity: 0.8, cursor: 'pointer' }}
                  >
                    <Heart size={14} fill={isSongLiked(song) ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
