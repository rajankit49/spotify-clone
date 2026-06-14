import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Music, FolderPlus, FileAudio, Check } from 'lucide-react';
import '../styles/playlist.css'; // Reuse container stylings

const ArtistDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'album' | 'my-content'
  
  // Track state
  const [songTitle, setSongTitle] = useState('');
  const [songFile, setSongFile] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [uploading, setUploading] = useState(false);

  // Album state
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumCover, setAlbumCover] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  // My Content state
  const [mySongs, setMySongs] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const fetchMyContent = async () => {
    setLoadingContent(true);
    try {
      // Get all songs
      const songsRes = await api.get('/music');
      const allSongs = songsRes.data.musics || [];
      // Filter by current artist
      setMySongs(allSongs.filter(s => s.artist?._id === user?.id || s.artist === user?.id));

      // Get all albums
      const albumsRes = await api.get('/music/albums');
      const allAlbums = albumsRes.data.albums || [];
      setMyAlbums(allAlbums.filter(a => a.artist?._id === user?.id || a.artist === user?.id));
    } catch (error) {
      console.error('Error fetching artist content:', error);
    }
    setLoadingContent(false);
  };

  useEffect(() => {
    fetchMyContent();
  }, [user]);

  const handleUploadSong = async (e) => {
    e.preventDefault();
    if (!songTitle.trim() || !songFile) {
      toast.error('Please provide a song title and an audio file.');
      return;
    }

    const formData = new FormData();
    formData.append('title', songTitle.trim());
    formData.append('music', songFile);
    if (selectedAlbumId) {
      formData.append('albumId', selectedAlbumId);
    }

    setUploading(true);
    try {
      const response = await api.post('/music/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message || 'Song uploaded successfully!');
      setSongTitle('');
      setSongFile(null);
      setSelectedAlbumId('');
      // Reset file input value
      const fileInput = document.getElementById('audio-file-input');
      if (fileInput) fileInput.value = '';
      
      fetchMyContent();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload song.');
    }
    setUploading(false);
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      toast.error('Please enter an album title.');
      return;
    }

    setCreatingAlbum(true);
    try {
      const response = await api.post('/music/album', {
        title: albumTitle.trim(),
        musics: [],
        coverImage: albumCover.trim() || undefined
      });
      toast.success(response.data.message || 'Album created successfully!');
      setAlbumTitle('');
      setAlbumCover('');
      fetchMyContent();
    } catch (error) {
      console.error('Album creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create album.');
    }
    setCreatingAlbum(false);
  };

  return (
    <div style={{ padding: '32px', color: 'var(--text-base)', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-subdued)' }}>Artist Portal</span>
        <h1 style={{ fontSize: '2.5rem', margin: '4px 0 24px 0', fontWeight: '800' }}>Dashboard</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #282828', paddingBottom: '12px', marginBottom: '32px' }}>
        <button 
          onClick={() => setActiveTab('upload')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'upload' ? 'var(--bg-elevated)' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: activeTab === 'upload' ? 'var(--spotify-green)' : 'var(--text-subdued)',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Upload Song
        </button>
        <button 
          onClick={() => setActiveTab('album')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'album' ? 'var(--bg-elevated)' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: activeTab === 'album' ? 'var(--spotify-green)' : 'var(--text-subdued)',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Create Album
        </button>
        <button 
          onClick={() => { setActiveTab('my-content'); fetchMyContent(); }}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'my-content' ? 'var(--bg-elevated)' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: activeTab === 'my-content' ? 'var(--spotify-green)' : 'var(--text-subdued)',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          My Tracks & Albums
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSong} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Song Title</label>
            <input 
              type="text" 
              className="playlist-create-input" 
              placeholder="e.g. Moonlight Sonata"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              style={{ outline: 'none', backgroundColor: '#282828' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Add to Album (Optional)</label>
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#282828',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 12px',
                color: 'var(--text-base)',
                fontSize: '0.875rem'
              }}
            >
              <option value="">-- Single (No Album) --</option>
              {myAlbums.map(album => (
                <option key={album._id} value={album._id}>{album.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Audio File (MP3, WAV, etc.)</label>
            <div style={{
              border: '2px dashed #444',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#181818'
            }}>
              <input 
                type="file" 
                id="audio-file-input"
                accept="audio/*" 
                onChange={(e) => setSongFile(e.target.files[0])}
                style={{ display: 'block', margin: '0 auto', color: 'var(--text-subdued)' }}
                required
              />
              {songFile && (
                <p style={{ marginTop: '12px', color: 'var(--spotify-green)', fontSize: '0.85rem', fontWeight: '600' }}>
                  Selected: {songFile.name}
                </p>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            style={{
              padding: '12px',
              backgroundColor: 'var(--spotify-green)',
              color: '#000',
              border: 'none',
              borderRadius: '500px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Music size={18} />
            {uploading ? 'Uploading to CDN...' : 'Publish Song'}
          </button>
        </form>
      )}

      {activeTab === 'album' && (
        <form onSubmit={handleCreateAlbum} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Album Title</label>
            <input 
              type="text" 
              className="playlist-create-input" 
              placeholder="e.g. Summer Chill Beats"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              style={{ outline: 'none', backgroundColor: '#282828' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Cover Image URL (Optional)</label>
            <input 
              type="url" 
              className="playlist-create-input" 
              placeholder="e.g. https://example.com/cover.jpg"
              value={albumCover}
              onChange={(e) => setAlbumCover(e.target.value)}
              style={{ outline: 'none', backgroundColor: '#282828' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={creatingAlbum}
            style={{
              padding: '12px',
              backgroundColor: 'var(--spotify-green)',
              color: '#000',
              border: 'none',
              borderRadius: '500px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FolderPlus size={18} />
            {creatingAlbum ? 'Creating Album...' : 'Create Album'}
          </button>
        </form>
      )}

      {activeTab === 'my-content' && (
        <div>
          {loadingContent ? (
            <div style={{ color: 'var(--text-subdued)' }}>Loading content...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* My Albums */}
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: '700' }}>My Albums ({myAlbums.length})</h3>
                {myAlbums.length === 0 ? (
                  <p style={{ color: 'var(--text-subdued)', fontSize: '0.9rem' }}>You haven't created any albums yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {myAlbums.map(album => (
                      <div key={album._id} style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '6px' }}>
                        <img 
                          src={album.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.title)}&background=random&color=fff&size=150`} 
                          alt="" 
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }}
                        />
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-subdued)' }}>{album.musics?.length || 0} tracks</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Tracks */}
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: '700' }}>My Published Tracks ({mySongs.length})</h3>
                {mySongs.length === 0 ? (
                  <p style={{ color: 'var(--text-subdued)', fontSize: '0.9rem' }}>You haven't uploaded any songs yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mySongs.map((song, idx) => (
                      <div key={song._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '8px 16px', backgroundColor: '#181818', borderRadius: '4px', gap: '12px' }}>
                        <div style={{ width: '30px', color: 'var(--text-subdued)' }}>{idx + 1}</div>
                        <FileAudio size={20} style={{ color: 'var(--spotify-green)' }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0', fontSize: '0.9rem', fontWeight: '600' }}>{song.title}</h4>
                        </div>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: song.status === 'approved' ? 'var(--spotify-green)' : song.status === 'rejected' ? '#ff4d4d' : '#ffb700',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {song.status || 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
