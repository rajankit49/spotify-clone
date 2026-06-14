import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Repeat, Repeat1, Shuffle, Volume2, VolumeX, Volume1, Heart,
  AlignLeft, Users, Download, CheckCircle2, Radio
} from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';
import '../styles/layout.css';

const Player = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffle,
    repeatMode,
    togglePlay,
    skipNext,
    skipPrev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    queue,
    currentIndex,
    isSongLiked,
    toggleLike,
    lyrics,
    downloadedSongs,
    downloadTrack,
    deleteDownloadedTrack,
    jamRoom,
    startJamSession,
    joinJamSession,
    leaveJamSession
  } = useContext(PlayerContext);

  const [showLyrics, setShowLyrics] = useState(false);
  const [showJamPanel, setShowJamPanel] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  
  const lyricsContainerRef = useRef(null);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSongCover = (song, size = 100) => {
    if (!song) return '';
    if (song.coverImage) return song.coverImage;
    const titleLower = (song.title || "").toLowerCase();
    if (titleLower.includes("shiv") || titleLower.includes("guru") || titleLower.includes("mahadev")) {
      return "/shiva.png";
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=random&color=fff&size=${size}`;
  };

  const activeLyricIndex = lyrics.reduce((acc, line, idx) => {
    if (progress >= line.time) return idx;
    return acc;
  }, 0);

  // Auto-scroll active lyric line into view
  useEffect(() => {
    if (showLyrics && lyricsContainerRef.current) {
      const activeLineEl = lyricsContainerRef.current.querySelector('.lyric-line-active');
      if (activeLineEl) {
        activeLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, showLyrics]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const progressPercent = duration ? (progress / duration) * 100 : 0;

  const isSongDownloaded = currentSong && downloadedSongs.some(s => s._id === currentSong._id);

  return (
    <div className="player" style={{ position: 'relative' }}>
      {/* LEFT — Song Info & Offline Downloader */}
      <div className="player-left">
        {currentSong ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={getSongCover(currentSong, 100)}
              alt="Album Art"
              style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{
                fontSize: '0.875rem', fontWeight: '700',
                color: 'var(--text-base)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px'
              }}>
                {currentSong.title}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subdued)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {currentSong.artist?.username || 'Unknown Artist'}
              </span>
            </div>
            
            {/* Like button */}
            {(() => {
              const isLiked = isSongLiked(currentSong);
              return (
                <button
                  className="control-btn"
                  onClick={() => toggleLike(currentSong)}
                  title={isLiked ? "Unlike song" : "Like song"}
                  style={{ color: isLiked ? 'var(--spotify-green)' : undefined, marginLeft: '8px' }}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
              );
            })()}

            {/* Offline download button */}
            {isSongDownloaded ? (
              <button
                className="control-btn"
                onClick={() => deleteDownloadedTrack(currentSong)}
                title="Remove offline download"
                style={{ color: 'var(--spotify-green)', marginLeft: '8px' }}
              >
                <CheckCircle2 size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                className="control-btn"
                onClick={() => downloadTrack(currentSong)}
                title="Download for offline playback"
                style={{ marginLeft: '8px' }}
              >
                <Download size={16} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-subdued)', fontSize: '0.8rem' }}>
            Nothing playing yet
          </div>
        )}
      </div>

      {/* CENTER — Playback Controls + Progress */}
      <div className="player-center">
        <div className="player-controls">
          <button
            className={`control-btn ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title="Shuffle"
            style={{ color: isShuffle ? 'var(--spotify-green)' : undefined }}
          >
            <Shuffle size={16} />
          </button>

          <button
            className="control-btn"
            onClick={skipPrev}
            disabled={!currentSong}
            title="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            className="play-btn"
            onClick={togglePlay}
            disabled={!currentSong}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={16} fill="currentColor" />
              : <Play size={16} fill="currentColor" />
            }
          </button>

          <button
            className="control-btn"
            onClick={() => skipNext(false)}
            disabled={!currentSong}
            title="Next"
          >
            <SkipForward size={20} />
          </button>

          <button
            className={`control-btn`}
            onClick={cycleRepeat}
            title={`Repeat: ${repeatMode}`}
            style={{ color: repeatMode !== 'none' ? 'var(--spotify-green)' : undefined, position: 'relative' }}
          >
            <RepeatIcon size={16} />
            {repeatMode === 'one' && (
              <span style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: 'var(--spotify-green)'
              }} />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subdued)', minWidth: '36px', textAlign: 'right' }}>
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress || 0}
            className="custom-range"
            onChange={(e) => seek(Number(e.target.value))}
            style={{ '--progress': `${progressPercent}%` }}
            disabled={!currentSong}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subdued)', minWidth: '36px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT — Volume, Lyrics, Jam */}
      <div className="player-right" style={{ justifyContent: 'flex-end', gap: '16px' }}>
        {/* Toggle Synced Lyrics */}
        <button
          className="control-btn"
          onClick={() => {
            if (currentSong) setShowLyrics(prev => !prev);
          }}
          title="Lyrics"
          style={{ color: showLyrics ? 'var(--spotify-green)' : undefined }}
          disabled={!currentSong}
        >
          <AlignLeft size={18} />
        </button>

        {/* Toggle Jam session controls */}
        <button
          className="control-btn"
          onClick={() => setShowJamPanel(prev => !prev)}
          title="Spotify Jam Session"
          style={{ color: jamRoom ? 'var(--spotify-green)' : undefined }}
        >
          <Users size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="control-btn"
            onClick={() => {
              if (volume === 0) {
                const saved = localStorage.getItem('player_volume_before_mute');
                setVolume(saved ? parseFloat(saved) : 0.7);
              } else {
                localStorage.setItem('player_volume_before_mute', volume);
                setVolume(0);
              }
            }}
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon size={16} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            className="custom-range"
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: '80px', flex: 'none', '--progress': `${volume * 100}%` }}
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {/* Synced Lyrics Full-Screen Overlay */}
      {showLyrics && currentSong && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: '90px',
          backgroundColor: 'rgba(12, 12, 12, 0.95)',
          backdropFilter: 'blur(30px)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px',
          color: '#fff',
          animation: 'slideUp 0.3s ease-out',
          overflow: 'hidden'
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .lyric-line {
              font-size: 2.2rem;
              font-weight: 800;
              margin: 16px 0;
              color: rgba(255, 255, 255, 0.3);
              cursor: pointer;
              transition: color 0.2s ease, transform 0.2s ease;
              line-height: 1.4;
            }
            .lyric-line:hover {
              color: #fff;
              transform: scale(1.02);
            }
            .lyric-line-active {
              color: var(--spotify-green) !important;
              transform: scale(1.05);
            }
          `}</style>
          
          {/* Lyrics Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src={getSongCover(currentSong, 80)} 
                alt="" 
                style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
              />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{currentSong.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-subdued)', margin: 0 }}>{currentSong.artist?.username || 'Unknown Artist'}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLyrics(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* Sync lines */}
          <div 
            ref={lyricsContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '12px',
              paddingBottom: '20%',
              scrollBehavior: 'smooth'
            }}
          >
            {lyrics.length === 0 ? (
              <p style={{ fontSize: '1.5rem', color: 'var(--text-subdued)' }}>No lyrics available for this song.</p>
            ) : (
              lyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <div 
                    key={`lyric-${idx}`}
                    onClick={() => seek(line.time)}
                    className={`lyric-line ${isActive ? 'lyric-line-active' : ''}`}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Jam Session Popover */}
      {showJamPanel && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          right: '24px',
          width: '320px',
          backgroundColor: '#181818',
          border: '1px solid #282828',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} style={{ color: 'var(--spotify-green)' }} />
              Spotify Jam Session
            </span>
            <button 
              onClick={() => setShowJamPanel(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>

          {!jamRoom ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subdued)', margin: 0, lineHeight: 1.4 }}>
                Listen to music together in real-time. Start a session as a host or join a friend's session.
              </p>
              <button 
                onClick={startJamSession}
                style={{
                  backgroundColor: 'var(--spotify-green)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '500px',
                  padding: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'transform 0.1s'
                }}
              >
                Start a Jam Session
              </button>
              
              <div style={{ borderTop: '1px solid #282828', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Join a session</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter Code (e.g. JAM123)"
                    style={{
                      flex: 1,
                      backgroundColor: '#282828',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (joinCodeInput) {
                        joinJamSession(joinCodeInput);
                        setJoinCodeInput('');
                      }
                    }}
                    style={{
                      backgroundColor: '#fff',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#282828', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subdued)', display: 'block', textTransform: 'uppercase' }}>Room Code</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--spotify-green)', letterSpacing: '2px' }}>{jamRoom.roomCode}</span>
              </div>

              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-subdued)', display: 'block', marginBottom: '6px' }}>
                  Participants ({jamRoom.members.length})
                </span>
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {jamRoom.members.map(member => (
                    <div key={member.userId} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                      <span>{member.username}</span>
                      {member.userId === jamRoom.hostId && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--spotify-green)', fontWeight: '700' }}>Host</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={leaveJamSession}
                style={{
                  backgroundColor: '#e91429',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '500px',
                  padding: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Leave Jam
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Player;
