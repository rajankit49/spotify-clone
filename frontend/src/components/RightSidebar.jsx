import React, { useContext, useEffect, useState } from 'react';
import { PlayerContext, cleanSongTitle } from '../context/PlayerContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const RightSidebar = () => {
  const { 
    currentSong, 
    isSongLiked, 
    toggleLike, 
    queue, 
    currentIndex, 
    playQueue, 
    removeFromQueue, 
    clearQueue,
    friendActivities
  } = useContext(PlayerContext);
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const getSongCover = (song, size = 100) => {
    if (!song) return '';
    if (song.coverImage) return song.coverImage;
    const titleLower = (song.title || "").toLowerCase();
    if (titleLower.includes("shiv") || titleLower.includes("guru") || titleLower.includes("mahadev")) {
      return "/shiva.png";
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=random&color=fff&size=${size}`;
  };

  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [artistFollowerCount, setArtistFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState('now-playing'); // 'now-playing' | 'queue' | 'friends'

  const artistId = currentSong?.artist?._id || currentSong?.artist?.id || currentSong?.artist;

  // Fetch whether current user follows this artist
  useEffect(() => {
    if (!currentUser || !artistId) return;

    const checkFollowStatus = async () => {
      try {
        const response = await api.get(`/user/profile/${currentUser.id}`);
        const userProfile = response.data.user;
        const following = userProfile?.following || [];
        const isMatched = following.some(f => 
          f._id === artistId || 
          f === artistId || 
          (f.username && currentSong?.artist?.username && f.username.toLowerCase() === currentSong.artist.username.toLowerCase())
        );
        setIsFollowing(isMatched);

        // Fetch target artist details for follower count
        const artistRes = await api.get(`/user/profile/${artistId}`);
        setArtistFollowerCount(artistRes.data.user?.followers?.length || 0);
      } catch (error) {
        console.error('Error checking follow status in RightSidebar:', error);
      }
    };

    checkFollowStatus();
  }, [currentUser, artistId]);

  const handleFollowToggle = async () => {
    if (!currentUser || !artistId) return;
    setLoadingFollow(true);
    try {
      const response = await api.post(`/user/follow/${artistId}`);
      const followed = response.data.message.includes('followed');
      setIsFollowing(followed);
      setArtistFollowerCount(prev => followed ? prev + 1 : Math.max(0, prev - 1));
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error toggling follow in RightSidebar:', error);
      toast.error('Could not complete follow action.');
    }
    setLoadingFollow(false);
  };

  const handleArtistClick = () => {
    if (artistId) {
      navigate(`/artist/${artistId}`);
    }
  };

  if (!currentSong) {
    return (
      <aside className="right-sidebar" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-subdued)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem' }}>Play a song to see details & credits</p>
      </aside>
    );
  }

  const isLiked = isSongLiked(currentSong);

  return (
    <aside className="right-sidebar">
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #282828', paddingBottom: '8px', marginBottom: '16px', flexShrink: 0 }}>
        <span 
          onClick={() => setActiveTab('now-playing')}
          style={{ 
            fontWeight: '700', 
            fontSize: '0.9rem', 
            color: activeTab === 'now-playing' ? '#fff' : 'var(--text-subdued)', 
            cursor: 'pointer',
            borderBottom: activeTab === 'now-playing' ? '2px solid var(--spotify-green)' : 'none',
            paddingBottom: '4px',
            transition: 'color 0.2s'
          }}
        >
          Now Playing
        </span>
        <span 
          onClick={() => setActiveTab('queue')}
          style={{ 
            fontWeight: '700', 
            fontSize: '0.9rem', 
            color: activeTab === 'queue' ? '#fff' : 'var(--text-subdued)', 
            cursor: 'pointer',
            borderBottom: activeTab === 'queue' ? '2px solid var(--spotify-green)' : 'none',
            paddingBottom: '4px',
            transition: 'color 0.2s'
          }}
        >
          Queue
        </span>
        <span 
          onClick={() => setActiveTab('friends')}
          style={{ 
            fontWeight: '700', 
            fontSize: '0.9rem', 
            color: activeTab === 'friends' ? '#fff' : 'var(--text-subdued)', 
            cursor: 'pointer',
            borderBottom: activeTab === 'friends' ? '2px solid var(--spotify-green)' : 'none',
            paddingBottom: '4px',
            transition: 'color 0.2s'
          }}
        >
          Friends
        </span>
      </div>

      {activeTab === 'now-playing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* Large Cover Art */}
          <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', flexShrink: 0 }}>
            <img 
              src={getSongCover(currentSong, 300)} 
              alt={cleanSongTitle(currentSong.title)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Song Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px 0', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cleanSongTitle(currentSong.title)}
              </h3>
              <span 
                onClick={handleArtistClick}
                style={{ fontSize: '0.9rem', color: 'var(--text-subdued)', cursor: 'pointer', fontWeight: '500' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subdued)'}
              >
                {currentSong.artist?.username || 'Unknown Artist'}
              </span>
            </div>
            <button
              className="control-btn"
              onClick={() => toggleLike(currentSong)}
              title={isLiked ? "Remove from Library" : "Save to Library"}
              style={{ color: isLiked ? 'var(--spotify-green)' : 'var(--text-subdued)', marginTop: '4px' }}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Credits Panel */}
          <div style={{ backgroundColor: '#181818', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>Credits</span>
              <span 
                onClick={handleArtistClick}
                style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-subdued)', cursor: 'pointer' }}
              >
                Show all
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span 
                    onClick={handleArtistClick}
                    style={{ fontSize: '0.875rem', fontWeight: '700', color: '#fff', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {currentSong.artist?.username || 'Unknown Artist'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subdued)' }}>Main Artist</span>
                </div>
              </div>
              
              {currentUser && currentUser.id !== artistId && artistId && (
                <button
                  onClick={handleFollowToggle}
                  disabled={loadingFollow}
                  style={{
                    backgroundColor: isFollowing ? 'transparent' : '#fff',
                    color: isFollowing ? '#fff' : '#000',
                    border: isFollowing ? '1px solid #555' : 'none',
                    borderRadius: '500px',
                    padding: '6px 16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'friends' ? (
        /* Friends View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-subdued)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700', letterSpacing: '0.5px' }}>Friend Activity</h4>
          {Object.keys(friendActivities).length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subdued)', textAlign: 'center', padding: '24px 0' }}>
              No recent activity from friends.
            </span>
          ) : (
            Object.values(friendActivities).map(({ friend, song }) => (
              <div 
                key={friend._id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 8px', 
                  borderRadius: '6px', 
                  backgroundColor: 'rgba(255,255,255,0.03)' 
                }}
              >
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--spotify-green)', 
                  color: '#000',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {friend.username}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--spotify-green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600' }}>
                    ⚡ {cleanSongTitle(song.title)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subdued)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    by {song.artist?.username || 'Unknown Artist'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Queue View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0 }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-subdued)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700', letterSpacing: '0.5px' }}>Now Playing</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <img 
                src={getSongCover(currentSong, 50)}
                alt=""
                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--spotify-green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cleanSongTitle(currentSong.title)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subdued)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentSong.artist?.username || 'Unknown Artist'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-subdued)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Next Up</h4>
              {queue.length > 1 && (
                <button 
                  onClick={clearQueue}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-subdued)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subdued)'}
                >
                  Clear queue
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {queue.slice(currentIndex + 1).length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subdued)', textAlign: 'center', padding: '24px 0' }}>Queue is empty</span>
              ) : (
                queue.map((song, idx) => {
                  const absoluteIndex = idx;
                  if (absoluteIndex <= currentIndex) return null;

                  return (
                    <div 
                      key={`${song._id}-${absoluteIndex}`}
                      onClick={() => playQueue(queue, absoluteIndex)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '6px 8px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      className="queue-row"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <img 
                        src={getSongCover(song, 50)}
                        alt=""
                        style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cleanSongTitle(song.title)}
                        </span>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-subdued)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {song.artist?.username || 'Unknown Artist'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent playing
                          removeFromQueue(absoluteIndex);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subdued)'}
                        title="Remove from queue"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;
