import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Users } from 'lucide-react';
import api from '../services/api';
import { PlayerContext, cleanSongTitle } from '../context/PlayerContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import '../styles/playlist.css'; // Reuse styles

const ArtistDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const { playQueue, currentSong, isPlaying, togglePlay } = useContext(PlayerContext);

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchArtistData = async () => {
    setLoading(true);
    try {
      // 1. Get profile details
      const profileRes = await api.get(`/user/profile/${id}`);
      const artistData = profileRes.data.user;
      setArtist(artistData);

      // Check if logged-in user follows this artist
      if (currentUser && artistData.followers) {
        const following = artistData.followers.some(f => f._id === currentUser.id || f === currentUser.id);
        setIsFollowing(following);
      }

      // 2. Get all songs and filter by this artist
      const songsRes = await api.get('/music');
      const allSongs = songsRes.data.musics || [];
      setSongs(allSongs.filter(s => s.artist?._id === id || s.artist === id));

      // 3. Get all albums and filter by this artist
      const albumsRes = await api.get('/music/albums');
      const allAlbums = albumsRes.data.albums || [];
      setAlbums(allAlbums.filter(a => a.artist?._id === id || a.artist === id));
    } catch (error) {
      console.error('Error fetching artist detail:', error);
      toast.error('Failed to load artist details.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArtistData();
  }, [id, currentUser]);

  const handleFollowToggle = async () => {
    try {
      const response = await api.post(`/user/follow/${id}`);
      const followed = response.data.message.includes('followed');
      setIsFollowing(followed);
      toast.success(response.data.message);
      
      // Update local follower list/count
      setArtist(prev => {
        if (!prev) return null;
        let updatedFollowers = [...(prev.followers || [])];
        if (followed) {
          updatedFollowers.push(currentUser);
        } else {
          updatedFollowers = updatedFollowers.filter(f => f._id !== currentUser.id && f !== currentUser.id);
        }
        return {
          ...prev,
          followers: updatedFollowers
        };
      });
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast.error('Could not complete follow action.');
    }
  };

  const handlePlayAll = () => {
    if (!songs.length) return;
    const isCurrentArtistPlaying = isPlaying && songs.some(s => s._id === currentSong?._id);
    if (isCurrentArtistPlaying) {
      togglePlay();
    } else {
      playQueue(songs, 0);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '3:45';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Loading artist profile...</div>;
  if (!artist) return <div style={{ padding: '48px', color: 'var(--text-subdued)' }}>Artist not found.</div>;

  const isCurrentArtistPlaying = isPlaying && songs.some(s => s._id === currentSong?._id);

  return (
    <div className="playlist-container" style={{ overflowY: 'auto', height: '100%' }}>
      {/* Hero Banner Section */}
      <div 
        className="playlist-hero"
        style={{
          background: 'linear-gradient(to bottom, #383838, #121212)',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '32px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.username)}&background=random&color=fff&size=200`}
            alt={artist.username}
            style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ backgroundColor: '#005fcc', fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Verified Artist</span>
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: '900', margin: '0 0 16px 0', lineHeight: '1.1', color: '#fff' }}>
              {artist.username}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-subdued)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={16} />
                {artist.followers?.length || 0} followers
              </span>
              <span>·</span>
              <span>Following {artist.following?.length || 0} artists</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 32px' }}>
        <button 
          className="playlist-play-btn" 
          onClick={handlePlayAll} 
          disabled={!songs.length}
          style={{ width: '56px', height: '56px' }}
        >
          {isCurrentArtistPlaying
            ? <Pause size={24} fill="currentColor" />
            : <Play size={24} fill="currentColor" />
          }
        </button>

        {currentUser?.id !== id && (
          <button
            onClick={handleFollowToggle}
            style={{
              backgroundColor: isFollowing ? 'transparent' : '#fff',
              color: isFollowing ? '#fff' : '#000',
              border: isFollowing ? '1px solid #555' : 'none',
              borderRadius: '500px',
              padding: '10px 24px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'transform 0.1s ease, border-color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Content Columns */}
      <div style={{ padding: '0 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Popular Tracks */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>Popular Tracks</h2>
          {songs.length === 0 ? (
            <p style={{ color: 'var(--text-subdued)', fontSize: '0.9rem' }}>No tracks available for this artist.</p>
          ) : (
            <div className="track-list" style={{ marginTop: '0' }}>
              <div className="track-list-header" style={{ gridTemplateColumns: '40px 1fr 60px' }}>
                <span>#</span>
                <span>Title</span>
                <span>⏱</span>
              </div>
              {songs.slice(0, 10).map((song, index) => {
                const isActive = currentSong?._id === song._id;
                return (
                  <div
                    key={song._id}
                    className={`track-row ${isActive ? 'active' : ''}`}
                    onClick={() => playQueue(songs, index)}
                    style={{ gridTemplateColumns: '40px 1fr 60px' }}
                  >
                    <div style={{ position: 'relative', textAlign: 'center', width: '24px' }}>
                      <span className="track-num" style={{ opacity: isActive ? 0 : 1 }}>{index + 1}</span>
                      <span className="track-play-icon" style={{ opacity: isActive ? 1 : undefined }}>
                        {isActive && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                      </span>
                    </div>
                    <div className="track-info">
                      <span className="track-title" style={{ color: isActive ? 'var(--spotify-green)' : undefined }}>
                        {cleanSongTitle(song.title)}
                      </span>
                    </div>
                    <span className="track-duration">{formatDuration(song.duration)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Albums Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>Albums</h2>
          {albums.length === 0 ? (
            <p style={{ color: 'var(--text-subdued)', fontSize: '0.9rem' }}>No albums released by this artist.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
              {albums.map(album => (
                <div 
                  key={album._id} 
                  style={{
                    backgroundColor: '#181818',
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onClick={() => window.location.href = `/album/${album._id}`}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#282828'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#181818'}
                >
                  <img 
                    src={album.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.title)}&background=random&color=fff&size=150`} 
                    alt="" 
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  />
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {album.title}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subdued)' }}>Album · {album.musics?.length || 0} songs</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ArtistDetail;
