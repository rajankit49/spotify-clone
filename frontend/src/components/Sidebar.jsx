import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Plus, Heart } from 'lucide-react';
import { getMyPlaylists, createPlaylist } from '../services/playlistService';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/layout.css';

const Sidebar = () => {
  const [playlists, setPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const playlistsData = await getMyPlaylists();
        setPlaylists(playlistsData || []);

        if (user && user.id) {
          const profileRes = await api.get(`/user/profile/${user.id}`);
          setFollowedArtists(profileRes.data.user?.following || []);
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      }
    };
    fetchSidebarData();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    if (e.key === 'Enter' && newPlaylistName.trim()) {
      const created = await createPlaylist(newPlaylistName.trim());
      if (created) {
        setPlaylists(prev => [...prev, created]);
        navigate(`/playlist/${created._id}`);
      }
      setNewPlaylistName('');
      setIsCreating(false);
    }
    if (e.key === 'Escape') {
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          Home
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={24} />
          Search
        </NavLink>
      </div>

      <div className="sidebar-library">
        <div className="sidebar-library-header">
          <div className="sidebar-link" style={{ cursor: 'default', flex: 1 }}>
            <Library size={24} />
            Your Library
          </div>
          <button
            className="sidebar-add-btn"
            onClick={() => setIsCreating(true)}
            title="Create playlist"
          >
            <Plus size={20} />
          </button>
        </div>

        {isCreating && (
          <div style={{ padding: '8px 16px' }}>
            <input
              autoFocus
              type="text"
              className="playlist-create-input"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={handleCreatePlaylist}
              onBlur={() => { setIsCreating(false); setNewPlaylistName(''); }}
            />
          </div>
        )}

        <div className="sidebar-playlists">
          <NavLink
            to="/liked"
            className={({ isActive }) => `sidebar-playlist-item ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-playlist-icon" style={{ background: 'linear-gradient(135deg, #4020a0, #80c0a0)', display: 'flex', alignItems: 'center', justify: 'center' }}>
              <Heart size={18} fill="currentColor" style={{ color: '#fff' }} />
            </div>
            <div className="sidebar-playlist-info">
              <span className="sidebar-playlist-name">Liked Songs</span>
              <span className="sidebar-playlist-sub">Playlist</span>
            </div>
          </NavLink>

          {playlists.map((playlist) => (
            <NavLink
              key={playlist._id}
              to={`/playlist/${playlist._id}`}
              className={({ isActive }) => `sidebar-playlist-item ${isActive ? 'active' : ''}`}
            >
              <div className="sidebar-playlist-icon" style={{ padding: 0, overflow: 'hidden' }}>
                <img 
                  src={playlist.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.title)}&background=random&color=fff&size=50`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="sidebar-playlist-info">
                <span className="sidebar-playlist-name">{playlist.title}</span>
                <span className="sidebar-playlist-sub">Playlist</span>
              </div>
            </NavLink>
          ))}
          {followedArtists.map((artist) => (
            <NavLink
              key={artist._id}
              to={`/artist/${artist._id}`}
              className={({ isActive }) => `sidebar-playlist-item ${isActive ? 'active' : ''}`}
            >
              <div 
                className="sidebar-playlist-icon" 
                style={{ 
                  borderRadius: '50%', // Circular avatars for artists
                  padding: 0, 
                  overflow: 'hidden' 
                }}
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.username)}&background=random&color=fff&size=50`}
                  alt={artist.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="sidebar-playlist-info">
                <span className="sidebar-playlist-name">{artist.username}</span>
                <span className="sidebar-playlist-sub">Artist</span>
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
