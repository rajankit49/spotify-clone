import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAlbums, getAllMusic } from '../services/musicService';
import api from '../services/api';
import { PlayerContext } from '../context/PlayerContext';
import ItemCard from '../components/ItemCard';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import '../styles/home.css';

const Home = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [music, setMusic] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMusicId, setSelectedMusicId] = useState(null);
  const { playQueue } = useContext(PlayerContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedAlbums, fetchedMusic, historyRes, recommendationsRes] = await Promise.all([
          getAllAlbums(),
          getAllMusic(),
          api.get('/user/history'),
          api.get('/user/recommendations').catch(() => ({ data: { recommendations: [] } }))
        ]);
        setAlbums(fetchedAlbums || []);
        setMusic(fetchedMusic || []);
        setHistory(historyRes.data.history || []);
        setRecommendations(recommendationsRes.data.recommendations || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const kishoreAlbum = albums.find(a => a.title.toLowerCase().includes('kishore'));
  const arijitAlbum = albums.find(a => a.title.toLowerCase().includes('arijit'));
  const veerZaaraAlbum = albums.find(a => a.title.toLowerCase().includes('zaara'));

  const artistsMap = {};
  music.forEach(s => {
    if (s.artist && (s.artist._id || s.artist.id)) {
      artistsMap[s.artist.username] = s.artist._id || s.artist.id;
    }
  });

  const recents = [
    { name: 'Veer - Zaara', type: 'album', id: veerZaaraAlbum?._id, cover: veerZaaraAlbum?.coverImage || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&h=100&fit=crop' },
    { name: 'Best of Kishore Kumar', type: 'album', id: kishoreAlbum?._id, cover: kishoreAlbum?.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' },
    { name: 'Arijit Singh Hits', type: 'album', id: arijitAlbum?._id, cover: arijitAlbum?.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop' },
    { name: 'Ghulam Ali', type: 'artist', id: artistsMap['Ghulam Ali'], cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
    { name: 'Kishore Kumar', type: 'artist', id: artistsMap['Kishore Kumar'], cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' },
    { name: 'Arijit Singh', type: 'artist', id: artistsMap['Arijit Singh'], cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop' },
    { name: 'Neha Kakkar', type: 'artist', id: artistsMap['Neha Kakkar'], cover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=100&h=100&fit=crop' },
    { name: 'Lata Mangeshkar', type: 'artist', id: artistsMap['Lata Mangeshkar'], cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=100&h=100&fit=crop' },
  ];

  const handleRecentClick = (item) => {
    if (!item.id) return;
    if (item.type === 'album') {
      navigate(`/album/${item.id}`);
    } else {
      navigate(`/artist/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="home-container" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-subdued)' }}>
        Loading your music...
      </div>
    );
  }

  return (
    <div className="home-container" style={{ padding: '24px 32px' }}>
      {/* 2x4 Recents Grid */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>Good evening</h2>
        <div className="recents-grid">
          {recents.map((item, idx) => (
            <div
              key={`recent-${idx}`}
              onClick={() => handleRecentClick(item)}
              className="recent-item"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)'}
            >
              <img
                src={item.cover}
                alt=""
                className="recent-item-img"
              />
              <span className="recent-item-text">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Played Section */}
      {history.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Recently Played</h2>
          <div className="grid-container">
            {history.slice(0, 6).map((song, index) => (
              <ItemCard
                key={`hist-${song._id}-${index}`}
                image={song.coverImage}
                title={song.title}
                subtitle={song.artist?.username || 'Artist'}
                showAddButton={true}
                onAddClick={() => {
                  setSelectedMusicId(song._id);
                  setAddModalOpen(true);
                }}
                onClick={() => playQueue(history, index)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended for You Section */}
      {recommendations.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Recommended for You</h2>
          <div className="grid-container">
            {recommendations.slice(0, 6).map((song, index) => (
              <ItemCard
                key={`rec-${song._id}-${index}`}
                image={song.coverImage}
                title={song.title}
                subtitle={song.artist?.username || 'Artist'}
                showAddButton={true}
                onAddClick={() => {
                  setSelectedMusicId(song._id);
                  setAddModalOpen(true);
                }}
                onClick={() => playQueue(recommendations, index)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Albums Section */}
      <section className="home-section">
        <h2 className="home-section-title">Featured Albums</h2>
        {albums.length > 0 ? (
          <div className="grid-container">
            {albums.map((album) => (
              <ItemCard
                key={album._id}
                image={album.coverImage}
                title={album.title}
                subtitle={`By ${album.artist?.username || 'Unknown Artist'}`}
                onClick={() => navigate(`/album/${album._id}`)}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-subdued)' }}>No albums found.</p>
        )}
      </section>

      {/* All Songs Section */}
      <section className="home-section">
        <h2 className="home-section-title">Discover Music</h2>
        {music.length > 0 ? (
          <div className="grid-container">
            {music.map((song, index) => (
              <ItemCard
                key={song._id}
                image={song.coverImage}
                title={song.title}
                subtitle={song.artist?.username || 'Unknown Artist'}
                showAddButton={true}
                onAddClick={() => {
                  setSelectedMusicId(song._id);
                  setAddModalOpen(true);
                }}
                // Play the entire music list as a queue starting from the clicked song
                onClick={() => playQueue(music, index)}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-subdued)' }}>No songs found.</p>
        )}
      </section>

      <AddToPlaylistModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        musicId={selectedMusicId} 
      />
    </div>
  );
};

export default Home;
