import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Trash2, Pencil, UserPlus, Users, Download } from 'lucide-react';
import { getPlaylistById, removeSongFromPlaylist } from '../services/playlistService';
import { PlayerContext } from '../context/PlayerContext';
import { AuthContext } from '../context/AuthContext';
import EditPlaylistModal from '../components/EditPlaylistModal';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import '../styles/playlist.css';

const PlaylistDetail = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { playQueue, currentSong, isPlaying, togglePlay, downloadTrack, downloadedSongs } = useContext(PlayerContext);
  
  const [inviteUsername, setInviteUsername] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!inviteUsername) return;
    try {
      const response = await api.post(`/playlist/${id}/collaborator`, { username: inviteUsername });
      setPlaylist(response.data.playlist);
      setInviteUsername('');
      toast.success('Collaborator added!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Could not add collaborator');
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const response = await api.post(`/playlist/${id}/collaborator/remove`, { userId });
      setPlaylist(response.data.playlist);
      toast.success('Collaborator removed.');
    } catch (err) {
      console.error(err);
      toast.error('Could not remove collaborator');
    }
  };

  const handleDownloadAll = async () => {
    if (!playlist?.musics?.length) return;
    setIsDownloadingAll(true);
    for (const song of playlist.musics) {
      const isDownloaded = downloadedSongs.some(s => s._id === song._id);
      if (!isDownloaded) {
        await downloadTrack(song);
      }
    }
    setIsDownloadingAll(false);
    toast.success('All playlist songs processed for offline caching!');
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      const data = await getPlaylistById(id);
      setPlaylist(data);
      setLoading(false);
    };
    fetchPlaylist();
  }, [id]);

  const handlePlayAll = () => {
    if (!playlist?.musics?.length) return;
    const isCurrentPlaylistPlaying =
      isPlaying && playlist.musics.some(s => s._id === currentSong?._id || (s.uri && s.uri === currentSong?.uri));
    if (isCurrentPlaylistPlaying) {
      togglePlay();
    } else {
      playQueue(playlist.musics, 0);
    }
  };

  const handleRemoveSong = async (e, musicId) => {
    e.stopPropagation(); // Don't trigger row click (play)
    const confirmed = window.confirm('Remove this song from the playlist?');
    if (!confirmed) return;
    const result = await removeSongFromPlaylist(id, musicId);
    if (result) {
      setPlaylist(prev => ({
        ...prev,
        musics: prev.musics.filter(s => s._id !== musicId),
      }));
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Loading playlist...</div>;
  if (!playlist) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Playlist not found.</div>;

  const isCurrentPlaylistPlaying = isPlaying && playlist.musics?.some(s => s._id === currentSong?._id);

  const isOwner = user && playlist.owner && (playlist.owner._id === user.id || playlist.owner === user.id);

  return (
    <div className="playlist-container">
      {/* Hero Section */}
      <div 
        className="playlist-hero"
        style={{
          '--bg-image': `url(${playlist.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.title)}&background=random&color=fff&size=400&font-size=0.3`})`
        }}
      >
        {isOwner ? (
          <div 
            className="playlist-hero-image-wrapper"
            onClick={() => setIsEditModalOpen(true)}
            style={{
              position: 'relative',
              width: '200px',
              height: '200px',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 4px 60px rgba(0, 0, 0, 0.5)',
              flexShrink: 0
            }}
          >
            <img
              className="playlist-hero-image"
              src={playlist.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.title)}&background=random&color=fff&size=400&font-size=0.3`}
              alt={playlist.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div 
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                opacity: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'opacity 0.2s',
                flexDirection: 'column',
                gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <Pencil size={36} />
              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Edit details</span>
            </div>
          </div>
        ) : (
          <img
            className="playlist-hero-image"
            src={playlist.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.title)}&background=random&color=fff&size=400&font-size=0.3`}
            alt={playlist.title}
          />
        )}
        <div className="playlist-hero-info" style={{ cursor: isOwner ? 'pointer' : 'default' }} onClick={isOwner ? () => setIsEditModalOpen(true) : undefined}>
          <span className="playlist-hero-label">
            {playlist.collaborators?.length > 0 ? "Collaborative Playlist" : "Playlist"}
          </span>
          <h1 className="playlist-hero-title">{playlist.title}</h1>
          {playlist.description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-subdued)', marginTop: '4px' }}>{playlist.description}</p>
          )}
          <p className="playlist-hero-meta">
            {playlist.owner?.username || 'Unknown'} · {playlist.musics?.length || 0} songs
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="playlist-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="playlist-play-btn" onClick={handlePlayAll} disabled={!playlist.musics?.length}>
          {isCurrentPlaylistPlaying
            ? <Pause size={24} fill="currentColor" />
            : <Play size={24} fill="currentColor" />
          }
        </button>

        {playlist.musics?.length > 0 && (
          <button 
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
            style={{
              background: 'transparent',
              border: '1px solid #555',
              borderRadius: '500px',
              color: '#fff',
              padding: '8px 16px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem'
            }}
          >
            <Download size={16} />
            {isDownloadingAll ? 'Downloading...' : 'Download Playlist'}
          </button>
        )}
      </div>

      {/* Collaborators Panel */}
      {(isOwner || playlist.collaborators?.some(c => c._id === user?.id)) && (
        <div style={{
          margin: '0 0 24px 0',
          padding: '16px',
          backgroundColor: '#181818',
          borderRadius: '8px',
          border: '1px solid #282828'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Users size={18} style={{ color: 'var(--spotify-green)' }} />
              <span style={{ fontWeight: '700', fontSize: '0.9rem', marginRight: '12px' }}>Collaborators:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px', color: '#fff' }}>
                  Owner: {playlist.owner?.username}
                </span>
                {playlist.collaborators?.map(c => (
                  <span 
                    key={c._id} 
                    style={{ 
                      fontSize: '0.75rem', 
                      backgroundColor: 'rgba(255,255,255,0.05)', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#fff'
                    }}
                  >
                    {c.username}
                    {isOwner && (
                      <button 
                        onClick={() => handleRemoveCollaborator(c._id)}
                        style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem', padding: 0 }}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
            
            {isOwner && (
              <form onSubmit={handleAddCollaborator} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                  placeholder="Invite collaborator (username)" 
                  style={{
                    backgroundColor: '#282828',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: '0.8rem'
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    backgroundColor: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <UserPlus size={14} /> Invite
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="track-list">
        {playlist.musics?.length === 0 ? (
          <div className="empty-playlist-msg">
            <h3>This playlist is empty</h3>
            <p>Add songs from the Home or Search page!</p>
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
            {playlist.musics?.map((song, index) => {
              const isActive = currentSong?._id === song._id || (currentSong?.uri && currentSong.uri === song.uri);
              return (
                <div
                  key={song._id}
                  className={`track-row ${isActive ? 'active' : ''}`}
                  onClick={() => playQueue(playlist.musics, index)}
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
                  {(isOwner || playlist.collaborators?.some(c => c._id === user?.id)) && (
                    <button
                      className="control-btn track-remove-btn"
                      onClick={(e) => handleRemoveSong(e, song._id)}
                      title="Remove from playlist"
                      style={{ opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
      <EditPlaylistModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        playlist={playlist}
        onUpdate={(updated) => setPlaylist(updated)}
      />
    </div>
  );
};

export default PlaylistDetail;
