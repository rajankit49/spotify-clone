import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Repeat, Repeat1, Shuffle, Volume2, VolumeX, Volume1, Heart,
  AlignLeft, Users, Download, CheckCircle2, Radio, ChevronDown
} from 'lucide-react';
import { PlayerContext, cleanSongTitle } from '../context/PlayerContext';
import '../styles/layout.css';

// Custom Devices / Connect outline icon matching Spotify UI
const DevicesIcon = ({ size = 20, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="4" width="14" height="12" rx="2" />
    <path d="M6 16v3h6v-3" />
    <path d="M4 19h10" />
    <rect x="14" y="9" width="8" height="11" rx="1.5" fill="var(--mobile-player-bg, #181818)" />
    <circle cx="18" cy="12.5" r="1" fill="currentColor" />
    <circle cx="18" cy="16.5" r="1.5" fill="currentColor" />
  </svg>
);

// Muted dark dynamic song background colors for Spotify mobile look
const getSongColor = (song) => {
  if (!song) return '#282828';
  let hash = 0;
  const str = (song.title || '') + (song.artist?.username || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 50%, 14%)`;
};



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
    availableLyrics,
    preferredScript,
    togglePreferredScript,
    downloadedSongs,
    downloadTrack,
    deleteDownloadedTrack,
    jamRoom,
    startJamSession,
    joinJamSession,
    leaveJamSession,
    isPlayerExpanded,
    setIsPlayerExpanded
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
    <div 
      className="player" 
      style={{ 
        position: 'relative',
        '--mobile-player-bg': getSongColor(currentSong)
      }}
      onClick={(e) => {
        const isInteractive = e.target.closest('button') || e.target.closest('input') || e.target.closest('a');
        if (!isInteractive) {
          setIsPlayerExpanded(true);
        }
      }}
    >
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
                {cleanSongTitle(currentSong.title)}
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

      {/* Mobile-only Controls (Hidden on desktop via CSS) */}
      {currentSong && (
        <div className="player-mobile-controls">
          {/* Devices/Connect Button */}
          <button
            className="control-btn mobile-devices-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowJamPanel(prev => !prev);
            }}
            title="Connect to a device"
            style={{ color: '#fff', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}
          >
            <DevicesIcon size={22} />
          </button>

          {/* Play/Pause Button */}
          <button
            className="play-btn mobile-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            disabled={!currentSong}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{ 
              background: 'transparent', 
              color: '#fff', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 0,
              width: '28px',
              height: '28px'
            }}
          >
            {isPlaying
              ? <Pause size={28} fill="currentColor" stroke="currentColor" />
              : <Play size={28} fill="currentColor" stroke="currentColor" />
            }
          </button>
        </div>
      )}

      {/* Mobile-only bottom progress line */}
      {currentSong && (
        <div className="player-mobile-progress">
          <div 
            className="player-mobile-progress-bar" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      )}

      {/* Synced Lyrics Full-Screen Overlay */}
      {showLyrics && currentSong && (
        <div className="lyrics-overlay-panel">
          
          {/* Lyrics Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src={getSongCover(currentSong, 80)} 
                alt="" 
                style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
              />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{cleanSongTitle(currentSong.title)}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-subdued)', margin: 0 }}>{currentSong.artist?.username || 'Unknown Artist'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {availableLyrics && availableLyrics.english && availableLyrics.original && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreferredScript();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '500px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  🌐 {preferredScript === 'english' ? 'Original Script' : 'English Text'}
                </button>
              )}

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
        <div className="jam-popover" style={{
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

      {/* Expanded/Full-Screen Player Overlay */}
      {isPlayerExpanded && currentSong && (
        <div className="expanded-player">
          {/* Background Blurred Art */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${getSongCover(currentSong, 400)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(50px) brightness(0.25)',
            transform: 'scale(1.2)',
            zIndex: -1,
            pointerEvents: 'none'
          }} />

          {/* Header */}
          <div className="expanded-player-header">
            <button 
              className="expanded-player-close-btn"
              onClick={() => setIsPlayerExpanded(false)}
              title="Minimize"
            >
              <ChevronDown size={28} />
            </button>
            <div className="expanded-player-title-container">
              <span className="expanded-player-subtitle">PLAYING FROM QUEUE</span>
              <span className="expanded-player-source-title">{cleanSongTitle(currentSong.title)}</span>
            </div>
            <div style={{ width: '44px' }} /> {/* Spacer to center the title */}
          </div>

          {/* Main Content */}
          <div className="expanded-player-content">
            {/* Cover Art */}
            <div className="expanded-art-container">
              <img 
                src={getSongCover(currentSong, 400)} 
                alt={currentSong.title} 
                className="expanded-art"
              />
            </div>

            {/* Song Details */}
            <div className="expanded-info-container">
              <div className="expanded-song-details">
                <span className="expanded-song-title">{cleanSongTitle(currentSong.title)}</span>
                <span className="expanded-song-artist">{currentSong.artist?.username || 'Unknown Artist'}</span>
              </div>
              
              {/* Like / Heart Icon */}
              {(() => {
                const isLiked = isSongLiked(currentSong);
                return (
                  <button
                    className="control-btn"
                    onClick={() => toggleLike(currentSong)}
                    title={isLiked ? "Unlike song" : "Like song"}
                    style={{ color: isLiked ? 'var(--spotify-green)' : '#fff', transform: 'scale(1.3)', padding: '8px' }}
                  >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                );
              })()}
            </div>

            {/* Progress / Seek Slider */}
            <div className="expanded-progress-container">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress || 0}
                className="custom-range"
                onChange={(e) => seek(Number(e.target.value))}
                style={{ '--progress': `${progressPercent}%`, height: '6px', borderRadius: '3px' }}
                disabled={!currentSong}
              />
              <div className="expanded-time-row">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="expanded-controls-row">
              {/* Shuffle */}
              <button
                className={`control-btn ${isShuffle ? 'active' : ''}`}
                onClick={toggleShuffle}
                title="Shuffle"
                style={{ color: isShuffle ? 'var(--spotify-green)' : 'rgba(255,255,255,0.6)', transform: 'scale(1.2)' }}
              >
                <Shuffle size={20} />
              </button>

              {/* Previous */}
              <button
                className="control-btn"
                onClick={skipPrev}
                disabled={!currentSong}
                title="Previous"
                style={{ color: '#fff', transform: 'scale(1.3)' }}
              >
                <SkipBack size={24} />
              </button>

              {/* Play / Pause Toggle */}
              <button
                className="expanded-play-btn"
                onClick={togglePlay}
                disabled={!currentSong}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying
                  ? <Pause size={24} fill="currentColor" />
                  : <Play size={24} fill="currentColor" />
                }
              </button>

              {/* Next */}
              <button
                className="control-btn"
                onClick={() => skipNext(false)}
                disabled={!currentSong}
                title="Next"
                style={{ color: '#fff', transform: 'scale(1.3)' }}
              >
                <SkipForward size={24} />
              </button>

              {/* Repeat */}
              <button
                className="control-btn"
                onClick={cycleRepeat}
                title={`Repeat: ${repeatMode}`}
                style={{ color: repeatMode !== 'none' ? 'var(--spotify-green)' : 'rgba(255,255,255,0.6)', position: 'relative', transform: 'scale(1.2)' }}
              >
                <RepeatIcon size={20} />
                {repeatMode === 'one' && (
                  <span style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: 'var(--spotify-green)'
                  }} />
                )}
              </button>
            </div>

            {/* Footer Buttons (Lyrics, Jam, Volume) */}
            <div className="expanded-footer-controls">
              {/* Lyrics Button */}
              <button
                className="control-btn"
                onClick={() => setShowLyrics(prev => !prev)}
                title="Lyrics"
                style={{ color: showLyrics ? 'var(--spotify-green)' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AlignLeft size={20} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Lyrics</span>
              </button>

              {/* Jam Button */}
              <button
                className="control-btn"
                onClick={() => setShowJamPanel(prev => !prev)}
                title="Spotify Jam Session"
                style={{ color: jamRoom ? 'var(--spotify-green)' : 'rgba(255,255,255,0.7)' }}
              >
                <Users size={20} />
              </button>

              {/* Volume Slider */}
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
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <VolumeIcon size={18} />
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
