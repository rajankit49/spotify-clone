import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import { getAlbumById } from '../services/musicService';
import { PlayerContext } from '../context/PlayerContext';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import '../styles/playlist.css'; // We can reuse playlist.css for the album layout

const AlbumDetail = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playQueue, currentSong, isPlaying, togglePlay } = useContext(PlayerContext);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMusicId, setSelectedMusicId] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      const data = await getAlbumById(id);
      setAlbum(data);
      setLoading(false);
    };
    fetchAlbum();
  }, [id]);

  const handlePlayAll = () => {
    if (!album?.musics?.length) return;
    const isCurrentAlbumPlaying =
      isPlaying && album.musics.some(s => s._id === currentSong?._id || (s.uri && s.uri === currentSong?.uri));
    if (isCurrentAlbumPlaying) {
      togglePlay();
    } else {
      playQueue(album.musics, 0);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Loading album...</div>;
  if (!album) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Album not found.</div>;

  const isCurrentAlbumPlaying = isPlaying && album.musics?.some(s => s._id === currentSong?._id);

  return (
    <div className="playlist-container">
      {/* Hero Section */}
      <div 
        className="playlist-hero"
        style={{
          '--bg-image': `url(${album.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.title)}&background=random&color=fff&size=400&font-size=0.3`})`
        }}
      >
        <img
          className="playlist-hero-image"
          src={album.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.title)}&background=random&color=fff&size=400&font-size=0.3`}
          alt={album.title}
        />
        <div className="playlist-hero-info">
          <span className="playlist-hero-label">Album</span>
          <h1 className="playlist-hero-title">{album.title}</h1>
          <p className="playlist-hero-meta">
            {album.artist?.username} · {album.musics?.length || 0} songs
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="playlist-controls">
        <button className="playlist-play-btn" onClick={handlePlayAll} disabled={!album.musics?.length}>
          {isCurrentAlbumPlaying
            ? <Pause size={24} fill="currentColor" />
            : <Play size={24} fill="currentColor" />
          }
        </button>
      </div>

      {/* Track List */}
      <div className="track-list">
        {album.musics?.length === 0 ? (
          <div className="empty-playlist-msg">
            <h3>This album is empty</h3>
          </div>
        ) : (
          <>
            <div className="track-list-header" style={{ gridTemplateColumns: '40px 1fr 60px 40px' }}>
              <span>#</span>
              <span>Title</span>
              <span>⏱</span>
              <span></span>
            </div>
            {album.musics?.map((song, index) => {
              const isActive = currentSong?._id === song._id || (currentSong?.uri && currentSong.uri === song.uri);
              return (
                <div
                  key={song._id}
                  className={`track-row ${isActive ? 'active' : ''}`}
                  onClick={() => playQueue(album.musics, index)}
                  style={{ gridTemplateColumns: '40px 1fr 60px 40px' }}
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
                    <span className="track-artist">{song.artist?.username || album.artist?.username || 'Unknown'}</span>
                  </div>
                  <span className="track-duration">{formatDuration(song.duration)}</span>
                  <button
                    className="control-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMusicId(song._id);
                      setAddModalOpen(true);
                    }}
                    title="Add to playlist"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <AddToPlaylistModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        musicId={selectedMusicId} 
      />
    </div>
  );
};

export default AlbumDetail;
