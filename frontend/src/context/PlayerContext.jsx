import React, { createContext, useState, useRef, useEffect, useCallback, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export const PlayerContext = createContext();

const CACHE_NAME = 'spotify-offline-tracks';

export const cleanSongTitle = (title) => {
  if (!title) return '';
  return title
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

// Synced custom lyrics database
const customLyricsDb = {
  'kishore': [
    { time: 0, text: "🎶 (Intro music playing) 🎶" },
    { time: 5, text: "O mere dil ke chain..." },
    { time: 10, text: "Chain aaye mere dil ko dua kijiye..." },
    { time: 15, text: "O mere dil ke chain..." },
    { time: 20, text: "Apna hi saya dekh ke tum..." },
    { time: 25, text: "Jane jahan sharma gaye..." },
    { time: 30, text: "🎶 (Flute solo interlude) 🎶" },
    { time: 35, text: "Abhi toh baaki hai safar..." }
  ],
  'arijit': [
    { time: 0, text: "🎸 (Acoustic guitar playing) 🎸" },
    { time: 4, text: "Kyon ki tum hi ho..." },
    { time: 8, text: "Ab tum hi ho..." },
    { time: 12, text: "Zindagi ab tum hi ho..." },
    { time: 16, text: "Chain bhi, mera dard bhi..." },
    { time: 20, text: "Meri aashiqui ab tum hi ho..." },
    { time: 25, text: "Tera mera rishta purana..." },
    { time: 30, text: "🎶 (Violin playing) 🎶" }
  ],
  'zaara': [
    { time: 0, text: "🎻 (Santoor and Violin intro) 🎻" },
    { time: 6, text: "Tere liye hum hain jiye..." },
    { time: 12, text: "Hothon ko siye..." },
    { time: 18, text: "Tere liye hum hain jiye..." },
    { time: 24, text: "Apne dil mein kya bhare..." },
    { time: 30, text: "Aankhon mein aansu liye..." }
  ]
};

// Generate fallback time-synced lyrics
const generateLyrics = (song) => {
  if (!song || !song.title) return [];
  const titleLower = String(song.title).toLowerCase();
  
  for (const key in customLyricsDb) {
    if (titleLower.includes(key)) {
      return customLyricsDb[key];
    }
  }
  
  return [];
};

const fetchLyricsForSong = async (song) => {
  if (!song) return { english: [], original: [] };

  const decodedTitle = cleanSongTitle(song.title || '');
  const decodedArtist = cleanSongTitle(song.artist?.username || '');

  // Strip parentheticals like (From "Movie") or [From "Movie"] for search matching
  const coreTitle = decodedTitle
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hasNonLatin = (text) => /[^\x00-\x7F]/.test(text);

  // Helper to verify exact title match
  const isTitleMatch = (titleA, titleB) => {
    const clean = (t) => {
      return cleanSongTitle(String(t))
        .toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    return clean(titleA) === clean(titleB);
  };

  // Helper to parse LRC time strings like [02:14.30]
  const parseLrcText = (lrcText) => {
    if (!lrcText) return [];
    const lines = lrcText.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        const time = min * 60 + sec + (ms / 100);
        const text = cleanSongTitle(line.replace(timeRegex, '').trim());
        if (text) {
          parsed.push({ time, text });
        }
      }
    }
    return parsed.sort((a, b) => a.time - b.time);
  };

  // Helper to distribute plain lyrics evenly over duration
  const distributePlainLyrics = (plainText, durationSec) => {
    if (!plainText) return [];
    const lines = plainText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) return [];
    const duration = durationSec || 180;
    const startTime = 3;
    const endTime = duration - 10;
    const interval = (endTime - startTime) / lines.length;
    
    const synced = lines.map((text, idx) => ({
      time: startTime + (idx * interval),
      text: cleanSongTitle(text)
    }));
    
    synced.unshift({ time: 0, text: `🎶 Playing "${decodedTitle}" 🎶` });
    synced.push({ time: duration - 5, text: "🎶 (Instrumental / Outro) 🎶" });
    return synced;
  };

  const results = { english: null, original: null };

  // --- SOURCE 1: LRCLIB ---
  try {
    // Try exact get with decodedTitle first
    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(decodedTitle)}&artist_name=${encodeURIComponent(decodedArtist)}`;
    let getRes = await fetch(getUrl, {
      headers: { 'User-Agent': 'SpotifyClone/1.0.0 (https://github.com/rajankit49/spotify-clone)' }
    });

    // Fallback to coreTitle if first exact get fails and they differ
    if (!getRes.ok && coreTitle !== decodedTitle) {
      getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(coreTitle)}&artist_name=${encodeURIComponent(decodedArtist)}`;
      getRes = await fetch(getUrl, {
        headers: { 'User-Agent': 'SpotifyClone/1.0.0 (https://github.com/rajankit49/spotify-clone)' }
      });
    }

    if (getRes.ok) {
      const data = await getRes.json();
      const text = data.syncedLyrics || data.plainLyrics || '';
      const parsed = data.syncedLyrics ? parseLrcText(data.syncedLyrics) : distributePlainLyrics(data.plainLyrics, song.duration);
      if (hasNonLatin(text)) {
        results.original = parsed;
      } else {
        results.english = parsed;
      }
    }
  } catch (err) {
    console.warn('LRCLIB exact get failed:', err.message);
  }

  // LRCLIB Search Fallback (uses cleaned coreTitle query for better matching rate)
  if ((!results.english || results.english.length === 0) && (!results.original || results.original.length === 0)) {
    try {
      const query = `${coreTitle || decodedTitle} ${decodedArtist}`;
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'SpotifyClone/1.0.0 (https://github.com/rajankit49/spotify-clone)' }
      });
      if (searchRes.ok) {
        const data = await searchRes.json();
        const matches = data.filter(t => (t.syncedLyrics || t.plainLyrics) && isTitleMatch(coreTitle || decodedTitle, t.trackName));
        const candidates = matches.length > 0 ? matches : data;

        for (const track of candidates) {
          const text = track.syncedLyrics || track.plainLyrics;
          if (!text) continue;
          const parsed = track.syncedLyrics ? parseLrcText(track.syncedLyrics) : distributePlainLyrics(track.plainLyrics, song.duration);
          if (hasNonLatin(text)) {
            if (!results.original) results.original = parsed;
          } else {
            if (!results.english) results.english = parsed;
          }
          if (results.english && results.original) break;
        }
      }
    } catch (err) {
      console.warn('LRCLIB search fallback failed:', err.message);
    }
  }

  // --- SOURCE 2: JioSaavn API fallback ---
  if ((!results.english || results.english.length === 0) && (!results.original || results.original.length === 0)) {
    try {
      const query = `${coreTitle || decodedTitle} ${decodedArtist}`;
      const searchRes = await fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const resultsList = searchData.data?.results || [];
        const matches = resultsList.filter(t => isTitleMatch(coreTitle || decodedTitle, t.name));
        const bestTrack = matches.length > 0 ? matches[0] : resultsList[0];

        if (bestTrack) {
          const lyricsRes = await fetch(`https://saavn.sumit.co/api/songs/${bestTrack.id}/lyrics`);
          if (lyricsRes.ok) {
            const lyricsData = await lyricsRes.json();
            if (lyricsData.success && lyricsData.data?.lyrics) {
              const text = lyricsData.data?.lyrics;
              const parsed = distributePlainLyrics(text, song.duration);
              if (hasNonLatin(text)) {
                results.original = parsed;
              } else {
                results.english = parsed;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('JioSaavn lyrics fetch failed:', err.message);
    }
  }

  // --- SOURCE 3: Dummy Fallback ---
  if ((!results.english || results.english.length === 0) && (!results.original || results.original.length === 0)) {
    results.english = generateLyrics(song);
  }

  return results;
};

// Metadata helpers for offline download caching
const saveDownloadedSongMetadata = (song) => {
  const cached = JSON.parse(localStorage.getItem('downloaded_songs_metadata') || '[]');
  if (!cached.some(s => s._id === song._id)) {
    cached.push(song);
    localStorage.setItem('downloaded_songs_metadata', JSON.stringify(cached));
  }
};

const removeDownloadedSongMetadata = (songId) => {
  const cached = JSON.parse(localStorage.getItem('downloaded_songs_metadata') || '[]');
  const filtered = cached.filter(s => s._id !== songId);
  localStorage.setItem('downloaded_songs_metadata', JSON.stringify(filtered));
};

const getDownloadedSongsMetadata = () => {
  return JSON.parse(localStorage.getItem('downloaded_songs_metadata') || '[]');
};

export const PlayerProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'all' | 'one'
  
  const [likedSongs, setLikedSongs] = useState([]);
  const [likedSongIds, setLikedSongIds] = useState([]);
  const [likedSongUris, setLikedSongUris] = useState([]);
  
  // Real-time Lyrics, Friend Activity, offline downloads, Jam sessions state
  const [lyrics, setLyrics] = useState([]);
  const [availableLyrics, setAvailableLyrics] = useState({ english: null, original: null });
  const [preferredScript, setPreferredScriptState] = useState(() => {
    return localStorage.getItem('spotify_preferred_script') || 'english';
  });

  const togglePreferredScript = () => {
    const nextScript = preferredScript === 'english' ? 'original' : 'english';
    setPreferredScriptState(nextScript);
    localStorage.setItem('spotify_preferred_script', nextScript);
    
    if (nextScript === 'english' && availableLyrics.english) {
      setLyrics(availableLyrics.english);
    } else if (nextScript === 'original' && availableLyrics.original) {
      setLyrics(availableLyrics.original);
    } else if (availableLyrics.original || availableLyrics.english) {
      setLyrics(availableLyrics.original || availableLyrics.english);
    }
  };

  const [friendActivities, setFriendActivities] = useState({});
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [jamRoom, setJamRoom] = useState(null); // roomState object
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  const audioRef = useRef(new Audio());
  const socketRef = useRef(null);

  // Load downloads list on startup
  useEffect(() => {
    setDownloadedSongs(getDownloadedSongsMetadata());
  }, []);

  // Auto-fetch lyrics whenever currentSong changes (handles all song loads: search, library, jam room, etc.)
  useEffect(() => {
    if (!currentSong) {
      setLyrics([]);
      setAvailableLyrics({ english: null, original: null });
      return;
    }
    
    setLyrics([{ time: 0, text: "Loading lyrics..." }]);
    fetchLyricsForSong(currentSong).then(resultMap => {
      setAvailableLyrics(resultMap);
      const activeScript = localStorage.getItem('spotify_preferred_script') || 'english';
      if (activeScript === 'english' && resultMap.english) {
        setLyrics(resultMap.english);
      } else if (activeScript === 'original' && resultMap.original) {
        setLyrics(resultMap.original);
      } else {
        setLyrics(resultMap.english || resultMap.original || []);
      }
    }).catch(() => {
      const dummy = generateLyrics(currentSong);
      setAvailableLyrics({ english: dummy, original: null });
      setLyrics(dummy);
    });
  }, [currentSong]);

  // --- Socket.io Handlers ---
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to websocket server
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', user.id);
    });

    socket.on('friend_playing', ({ friend, song }) => {
      setFriendActivities(prev => ({
        ...prev,
        [friend._id]: { friend, song, timestamp: Date.now() }
      }));
    });

    socket.on('toast_message', ({ message }) => {
      toast(message, { icon: '🎵' });
    });

    socket.on('jam_created', (roomState) => {
      setJamRoom(roomState);
      toast.success(`Started a Jam! Code: ${roomState.roomCode}`);
    });

    socket.on('jam_joined', (roomState) => {
      setJamRoom(roomState);
      toast.success(`Joined Jam Room: ${roomState.roomCode}`);
    });

    socket.on('jam_update', (roomState) => {
      setJamRoom(roomState);
    });

    socket.on('jam_state_updated', ({ isPlaying: syncIsPlaying, progress: syncProgress, currentSong: syncSong, queue: syncQueue }) => {
      if (syncQueue) {
        setQueue(syncQueue);
      }
      if (syncSong) {
        const isDifferentSong = !currentSong || currentSong._id !== syncSong._id;
        if (isDifferentSong) {
          setCurrentSong(syncSong);
          audioRef.current.src = syncSong.uri || syncSong.audioUrl || '';
          if (syncIsPlaying) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
          } else {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        } else {
          // Playback play/pause alignment
          if (syncIsPlaying !== isPlaying) {
            if (syncIsPlaying) {
              audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
            } else {
              audioRef.current.pause();
              setIsPlaying(false);
            }
          }
        }
      }
      if (syncProgress !== undefined && Math.abs(audioRef.current.currentTime - syncProgress) > 2) {
        audioRef.current.currentTime = syncProgress;
        setProgress(syncProgress);
      }
    });

    socket.on('jam_queue_updated', (updatedQueue) => {
      setQueue(updatedQueue);
    });

    socket.on('jam_closed', ({ message }) => {
      setJamRoom(null);
      toast.error(message || 'Jam session closed.');
    });

    socket.on('jam_error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, currentSong, isPlaying]);

  // --- Audio Event Listeners ---
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      // If host in Jam, sync progress with server occasionally (every 3s)
      if (jamRoom && jamRoom.hostId === user?.id && Math.round(audio.currentTime) % 3 === 0) {
        socketRef.current.emit('jam_state_change', {
          roomCode: jamRoom.roomCode,
          progress: audio.currentTime
        });
      }
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
        return;
      }
      skipNext(true); // true = auto-end
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, isShuffle, queue, currentIndex, jamRoom, user]);

  // --- Volume ---
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);



  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    localStorage.setItem('player_volume', clamped);
  };

  // --- Local Caching (Downloads) Logic ---
  const downloadTrack = async (song) => {
    if (!song || !song.uri) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      toast.loading(`Downloading "${song.title}"...`, { id: song._id });
      const response = await fetch(song.uri);
      if (!response.ok) throw new Error('Network file request failed');
      await cache.put(song.uri, response.clone());
      
      saveDownloadedSongMetadata(song);
      setDownloadedSongs(getDownloadedSongsMetadata());
      toast.success(`Downloaded "${song.title}" offline!`, { id: song._id });
    } catch (err) {
      console.error(err);
      toast.error(`Could not download "${song.title}"`, { id: song._id });
    }
  };

  const deleteDownloadedTrack = async (song) => {
    if (!song || !song.uri) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(song.uri);
      removeDownloadedSongMetadata(song._id);
      setDownloadedSongs(getDownloadedSongsMetadata());
      toast.success(`Deleted "${song.title}" from downloads`);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Core: Load track & play ---
  const loadAndPlay = useCallback(async (songs, index) => {
    if (!songs || songs.length === 0 || index < 0 || index >= songs.length) return;
    const song = songs[index];
    setCurrentSong(song);
    setCurrentIndex(index);
    setProgress(0);
    setDuration(0);


    // Resolve URL for offline or online play
    let audioSrc = song.uri || song.audioUrl || '';
    const isOffline = !navigator.onLine;

    if (isOffline) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(audioSrc);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        audioSrc = URL.createObjectURL(blob);
      } else {
        toast.error(`"${song.title}" is not available offline.`);
        return;
      }
    }

    audioRef.current.src = audioSrc;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.error("Playback error:", err);
        toast.error(`Playback failed: ${err.message || 'Format not supported or network error'}`);
      });

    // Record history
    api.post(`/user/history/${song._id}`).catch(console.error);

    // Broadcast play state to sockets
    if (socketRef.current) {
      socketRef.current.emit('play_song', { userId: user.id, song });
      if (jamRoom) {
        socketRef.current.emit('jam_state_change', {
          roomCode: jamRoom.roomCode,
          isPlaying: true,
          currentSong: song,
          queue: songs
        });
      }
    }
  }, [user, jamRoom]);

  // --- Play a whole queue ---
  const playQueue = useCallback((songs, startIndex = 0) => {
    setQueue(songs);
    loadAndPlay(songs, startIndex);
    if (window.innerWidth <= 768) {
      setIsPlayerExpanded(true);
    }
  }, [loadAndPlay]);

  // --- Play a single song ---
  const playSong = useCallback((song) => {
    const idxInQueue = queue.findIndex(s => s._id === song._id);
    if (idxInQueue !== -1) {
      if (idxInQueue === currentIndex) {
        togglePlay();
        return;
      }
      loadAndPlay(queue, idxInQueue);
      if (window.innerWidth <= 768) {
        setIsPlayerExpanded(true);
      }
      return;
    }
    const newQueue = [song];
    setQueue(newQueue);
    loadAndPlay(newQueue, 0);
    if (window.innerWidth <= 768) {
      setIsPlayerExpanded(true);
    }
  }, [queue, currentIndex, loadAndPlay]);

  // --- Skip Next ---
  const skipNext = useCallback((fromEnd = false) => {
    if (queue.length === 0) return;

    if (isShuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (queue.length > 1 && randomIndex === currentIndex);
      loadAndPlay(queue, randomIndex);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      loadAndPlay(queue, nextIndex);
    } else if (repeatMode === 'all' || (fromEnd && repeatMode === 'all')) {
      loadAndPlay(queue, 0);
    } else {
      setIsPlaying(false);
      setProgress(0);
      if (jamRoom && socketRef.current) {
        socketRef.current.emit('jam_state_change', {
          roomCode: jamRoom.roomCode,
          isPlaying: false,
          progress: 0
        });
      }
    }
  }, [queue, currentIndex, isShuffle, repeatMode, loadAndPlay, jamRoom]);

  // --- Skip Previous ---
  const skipPrev = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      loadAndPlay(queue, prevIndex);
    } else if (repeatMode === 'all') {
      loadAndPlay(queue, queue.length - 1);
    }
  }, [queue, currentIndex, repeatMode, loadAndPlay]);

  // --- Toggle Play/Pause ---
  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    const nextPlayState = !isPlaying;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Playback error:", err);
          toast.error(`Playback failed: ${err.message || 'Format not supported or network error'}`);
        });
    }

    if (jamRoom && socketRef.current) {
      socketRef.current.emit('jam_state_change', {
        roomCode: jamRoom.roomCode,
        isPlaying: nextPlayState,
        progress: audioRef.current.currentTime
      });
    }
  }, [currentSong, isPlaying, jamRoom]);

  // --- Seek ---
  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
    
    if (jamRoom && socketRef.current) {
      socketRef.current.emit('jam_state_change', {
        roomCode: jamRoom.roomCode,
        progress: time
      });
    }
  }, [jamRoom]);

  // --- Shuffle & Repeat ---
  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const cycleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const fetchLikedSongs = useCallback(async () => {
    try {
      const response = await api.get('/user/likes');
      if (response.data && response.data.likedSongs) {
        const songs = response.data.likedSongs;
        setLikedSongs(songs);
        setLikedSongIds(songs.map(s => s._id || s));
        setLikedSongUris(songs.map(s => s.uri).filter(Boolean));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const isSongLiked = useCallback((song) => {
    if (!song) return false;
    const songId = song._id || song.id;
    return likedSongs.some(liked => liked && (liked._id === songId || liked.saavnId === song.saavnId || liked.spotifyId === song.spotifyId));
  }, [likedSongs]);

  const toggleLike = useCallback(async (songOrId) => {
    if (!songOrId) return;
    const songId = typeof songOrId === 'object' ? (songOrId._id || songOrId.id) : songOrId;
    try {
      await api.post(`/user/like/${songId}`);
      await fetchLikedSongs();
    } catch (error) {
      console.error(error);
    }
  }, [fetchLikedSongs]);

  const removeFromQueue = useCallback((index) => {
    if (index < 0 || index >= queue.length) return;
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    setQueue(newQueue);

    if (index === currentIndex) {
      if (newQueue.length === 0) {
        setCurrentSong(null);
        setCurrentIndex(-1);
        setIsPlaying(false);
        audioRef.current.pause();
      } else {
        const nextIndex = index >= newQueue.length ? newQueue.length - 1 : index;
        loadAndPlay(newQueue, nextIndex);
      }
    } else if (index < currentIndex) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }

    if (jamRoom && socketRef.current) {
      socketRef.current.emit('jam_state_change', {
        roomCode: jamRoom.roomCode,
        queue: newQueue
      });
    }
  }, [queue, currentIndex, loadAndPlay, jamRoom]);

  const clearQueue = useCallback(() => {
    const newQueue = currentSong ? [currentSong] : [];
    setQueue(newQueue);
    setCurrentIndex(currentSong ? 0 : -1);

    if (jamRoom && socketRef.current) {
      socketRef.current.emit('jam_state_change', {
        roomCode: jamRoom.roomCode,
        queue: newQueue
      });
    }
  }, [currentSong, jamRoom]);

  // --- Jam Controllers ---
  const startJamSession = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('create_jam', { hostId: user.id, username: user.username });
    }
  };

  const joinJamSession = (roomCode) => {
    if (socketRef.current && user && roomCode) {
      socketRef.current.emit('join_jam', { roomCode, userId: user.id, username: user.username });
    }
  };

  const leaveJamSession = () => {
    if (socketRef.current && jamRoom && user) {
      socketRef.current.emit('leave_jam', { roomCode: jamRoom.roomCode, userId: user.id, username: user.username });
      setJamRoom(null);
      toast.success('Left Jam Session');
    }
  };

  const jamAddToQueue = (song) => {
    if (socketRef.current && jamRoom && song) {
      socketRef.current.emit('jam_add_to_queue', { roomCode: jamRoom.roomCode, song });
    }
  };

  useEffect(() => {
    if (user) {
      fetchLikedSongs();
    }
  }, [user, fetchLikedSongs]);

  // --- Media Session API (Mobile Lock Screen Metadata) ---
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof window !== 'undefined' && window.MediaMetadata && currentSong) {
      const decodedTitle = cleanSongTitle(currentSong.title || 'Unknown Track');
      const decodedArtist = currentSong.artist?.username || 'Unknown Artist';
      
      let coverUrl = currentSong.coverImage || '';
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = window.location.origin + coverUrl;
      }
      if (!coverUrl) {
        coverUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(decodedTitle)}&background=random&color=fff&size=512`;
      }

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: decodedTitle,
        artist: decodedArtist,
        album: 'Spotify Clone',
        artwork: [
          { src: coverUrl, sizes: '96x96', type: 'image/png' },
          { src: coverUrl, sizes: '128x128', type: 'image/png' },
          { src: coverUrl, sizes: '192x192', type: 'image/png' },
          { src: coverUrl, sizes: '256x256', type: 'image/png' },
          { src: coverUrl, sizes: '384x384', type: 'image/png' },
          { src: coverUrl, sizes: '512x512', type: 'image/png' },
        ]
      });
    }
  }, [currentSong]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && currentSong) {
      try {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
        navigator.mediaSession.setActionHandler('nexttrack', () => skipNext(false));
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          seek(details.seekTime);
        });
      } catch (error) {
        console.warn('Media Session Action Handlers setup failed:', error);
      }
    }
  }, [currentSong, togglePlay, skipPrev, skipNext, seek]);

  return (
    <PlayerContext.Provider value={{
      queue,
      currentIndex,
      currentSong,
      isPlaying,
      progress,
      duration,
      volume,
      isShuffle,
      repeatMode,
      likedSongs,
      likedSongIds,
      likedSongUris,
      lyrics,
      availableLyrics,
      preferredScript,
      togglePreferredScript,
      friendActivities,
      downloadedSongs,
      jamRoom,
      isSongLiked,
      isPlayerExpanded,
      setIsPlayerExpanded,
      playSong,
      playQueue,
      togglePlay,
      skipNext,
      skipPrev,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
      toggleLike,
      fetchLikedSongs,
      removeFromQueue,
      clearQueue,
      downloadTrack,
      deleteDownloadedTrack,
      startJamSession,
      joinJamSession,
      leaveJamSession,
      jamAddToQueue
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
