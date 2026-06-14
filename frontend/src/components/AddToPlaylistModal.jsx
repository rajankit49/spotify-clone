import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getMyPlaylists, addSongToPlaylist } from '../services/playlistService';
import toast from 'react-hot-toast';

const AddToPlaylistModal = ({ isOpen, onClose, musicId }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlaylists = async () => {
      setLoading(true);
      const data = await getMyPlaylists();
      setPlaylists(data);
      setLoading(false);
    };

    fetchPlaylists();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (playlistId) => {
    const result = await addSongToPlaylist(playlistId, musicId);
    if (result) {
      toast.success('Added to playlist!');
      onClose();
    } else {
      toast.error('Failed to add to playlist.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#282828',
        padding: '24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90vw',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Add to Playlist</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#a7a7a7', textAlign: 'center', padding: '20px 0' }}>Loading playlists...</div>
        ) : playlists.length === 0 ? (
          <div style={{ color: '#a7a7a7', textAlign: 'center', padding: '20px 0' }}>
            You don't have any playlists yet.<br/>Create one in the sidebar!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {playlists.map(playlist => (
              <button
                key={playlist._id}
                onClick={() => handleAdd(playlist._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px',
                  backgroundColor: '#3e3e3e',
                  border: 'none', borderRadius: '4px',
                  color: '#fff', cursor: 'pointer',
                  textAlign: 'left', transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4e4e4e'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3e3e3e'}
              >
                <div style={{
                  width: '40px', height: '40px', backgroundColor: '#535353',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  fontWeight: 'bold', borderRadius: '4px'
                }}>
                  {playlist.title.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>{playlist.title}</span>
                  <span style={{ fontSize: '0.8rem', color: '#a7a7a7' }}>{playlist.musics?.length || 0} songs</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
