import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, Trash2, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import '../styles/playlist.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [pendingSongs, setPendingSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningSongId, setActioningSongId] = useState(null);

  // Audio player state for moderation previews
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    // Security check: Redirect non-admins
    if (user && user.role !== 'admin') {
      toast.error("Access Denied: Admins only.");
      navigate('/');
    }
  }, [user, navigate]);

  const fetchPendingSongs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/music/pending');
      setPendingSongs(response.data.musics || []);
    } catch (error) {
      console.error('Error fetching pending songs:', error);
      toast.error('Failed to load pending songs.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingSongs();
    
    // Cleanup audio on unmount
    return () => {
      audioRef.current.pause();
    };
  }, []);

  const handlePlayPreview = (song) => {
    if (playingId === song._id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      let cleanUri = song.uri;
      if (cleanUri && cleanUri.startsWith('http://')) {
        cleanUri = cleanUri.replace('http://', 'https://');
      }
      audioRef.current.src = cleanUri;
      audioRef.current.play()
        .then(() => setPlayingId(song._id))
        .catch(err => {
          console.error("Playback error:", err);
          toast.error("Failed to play preview. URL might be unreachable.");
        });
    }
  };

  const handleApprove = async (songId) => {
    setActioningSongId(songId);
    try {
      await api.post(`/music/approve/${songId}`);
      toast.success('Song approved and is now public!');
      
      // Stop audio if it was playing
      if (playingId === songId) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      
      // Filter out from pending list
      setPendingSongs(prev => prev.filter(s => s._id !== songId));
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve song.');
    }
    setActioningSongId(null);
  };

  const handleReject = async (songId) => {
    if (!window.confirm('Are you sure you want to reject and delete this song?')) {
      return;
    }
    
    setActioningSongId(songId);
    try {
      await api.post(`/music/reject/${songId}`);
      toast.success('Song rejected and deleted.');
      
      // Stop audio if it was playing
      if (playingId === songId) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      
      // Filter out from pending list
      setPendingSongs(prev => prev.filter(s => s._id !== songId));
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject song.');
    }
    setActioningSongId(null);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div style={{ padding: '32px', color: 'var(--text-base)', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-subdued)', fontWeight: '700' }}>Admin Portal</span>
          <h1 style={{ fontSize: '2.5rem', margin: '4px 0 0 0', fontWeight: '800' }}>Moderation Queue</h1>
        </div>
        <button 
          onClick={fetchPendingSongs}
          style={{
            padding: '8px 16px',
            backgroundColor: '#282828',
            color: '#fff',
            border: 'none',
            borderRadius: '500px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3e3e3e'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#282828'}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-subdued)', display: 'flex', gap: '8px', alignItems: 'center', padding: '16px' }}>
          <div className="spinner" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--spotify-green)', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
          Loading queue...
        </div>
      ) : pendingSongs.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          backgroundColor: '#121212',
          borderRadius: '8px',
          border: '1px solid #282828',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} style={{ color: 'var(--text-subdued)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Clean Queue!</h2>
          <p style={{ color: 'var(--text-subdued)', maxWidth: '350px', fontSize: '0.9rem' }}>No pending song uploads are currently waiting for your review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 120px 200px', padding: '12px 16px', borderBottom: '1px solid #282828', color: 'var(--text-subdued)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
            <div>Preview</div>
            <div>Title</div>
            <div>Artist</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          
          {pendingSongs.map((song) => (
            <div 
              key={song._id} 
              style={{
                display: 'grid', 
                gridTemplateColumns: '80px 1fr 1fr 120px 200px', 
                alignItems: 'center', 
                padding: '16px', 
                backgroundColor: '#181818', 
                borderRadius: '6px', 
                transition: 'background-color 0.2s',
                hover: { backgroundColor: '#282828' }
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#202020'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#181818'}
            >
              {/* Preview Button */}
              <div>
                <button
                  onClick={() => handlePlayPreview(song)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: playingId === song._id ? 'var(--spotify-green)' : '#282828',
                    color: playingId === song._id ? '#000' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                >
                  {playingId === song._id ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                </button>
              </div>

              {/* Title */}
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{song.title}</div>

              {/* Artist */}
              <div style={{ color: 'var(--text-subdued)', fontSize: '0.9rem' }}>
                {song.artist?.username || 'Unknown Artist'}
                {song.artist?.email && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#666' }}>{song.artist.email}</span>
                )}
              </div>

              {/* Status */}
              <div>
                <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#3e2e08', color: '#ffb700', fontWeight: '700', textTransform: 'uppercase' }}>
                  PENDING
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => handleApprove(song._id)}
                  disabled={actioningSongId !== null}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(29, 185, 84, 0.1)',
                    color: 'var(--spotify-green)',
                    border: '1px solid rgba(29, 185, 84, 0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--spotify-green)';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(29, 185, 84, 0.1)';
                    e.currentTarget.style.color = 'var(--spotify-green)';
                  }}
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(song._id)}
                  disabled={actioningSongId !== null}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 77, 77, 0.1)',
                    color: '#ff4d4d',
                    border: '1px solid rgba(255, 77, 77, 0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#ff4d4d';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
                    e.currentTarget.style.color = '#ff4d4d';
                  }}
                >
                  <Trash2 size={14} />
                  Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
