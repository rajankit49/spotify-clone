import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { globalSearch } from '../services/searchService';
import { PlayerContext } from '../context/PlayerContext';
import ItemCard from '../components/ItemCard';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import '../styles/search.css';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ musics: [], albums: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMusicId, setSelectedMusicId] = useState(null);
  const { playQueue } = useContext(PlayerContext);

  useEffect(() => {
    const qParam = new URLSearchParams(location.search).get('q') || '';
    setQuery(qParam);
  }, [location.search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim() === '') {
        setResults({ musics: [], albums: [], playlists: [] });
        return;
      }
      setLoading(true);
      const data = await globalSearch(query);
      setResults(data);
      setLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults =
    results.musics?.length > 0 ||
    results.albums?.length > 0 ||
    results.playlists?.length > 0;

  return (
    <div className="search-container">
      {/* Search bar is now globally rendered in the Topbar */}

      {loading && <div style={{ color: 'var(--text-subdued)', padding: '16px' }}>Searching...</div>}

      {!loading && query !== '' && !hasResults && (
        <div className="no-results-msg">
          <h2>No results found for "{query}"</h2>
          <p>Please make sure your words are spelled correctly or use less or different keywords.</p>
        </div>
      )}

      {!loading && hasResults && (
        <>
          {results.musics?.length > 0 && (
            <section className="search-results-section">
              <h2 className="search-results-title">Songs</h2>
              <div className="grid-container">
                {results.musics.map((song, index) => (
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
                    // Play the full songs result list as a queue
                    onClick={() => playQueue(results.musics, index)}
                  />
                ))}
              </div>
            </section>
          )}

          {results.albums?.length > 0 && (
            <section className="search-results-section">
              <h2 className="search-results-title">Albums</h2>
              <div className="grid-container">
                {results.albums.map((album) => (
                  <ItemCard
                    key={album._id}
                    image={album.coverImage}
                    title={album.title}
                    subtitle={`By ${album.artist?.username || 'Unknown Artist'}`}
                    onClick={() => navigate(`/album/${album._id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {results.playlists?.length > 0 && (
            <section className="search-results-section">
              <h2 className="search-results-title">Playlists</h2>
              <div className="grid-container">
                {results.playlists.map((playlist) => (
                  <ItemCard
                    key={playlist._id}
                    image={playlist.coverImage}
                    title={playlist.title}
                    subtitle={`By ${playlist.owner?.username || 'Unknown'}`}
                    onClick={() => navigate(`/playlist/${playlist._id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {query === '' && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>Browse all</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {[
              { name: 'Pop', color: '#148a08' },
              { name: 'Hip-Hop', color: '#ba5d07' },
              { name: 'Rock', color: '#e8115b' },
              { name: 'Lo-Fi / Chill', color: '#509bf5' },
              { name: 'Focus', color: '#1e3264' },
              { name: 'Workout', color: '#7720ca' },
              { name: 'Mood', color: '#e8115b' },
              { name: 'Sleep', color: '#1e3264' }
            ].map((genre) => (
              <div
                key={genre.name}
                onClick={() => setQuery(genre.name)}
                style={{
                  backgroundColor: genre.color,
                  height: '150px',
                  borderRadius: '8px',
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                  color: '#fff'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
              >
                <span>{genre.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <AddToPlaylistModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        musicId={selectedMusicId} 
      />
    </div>
  );
};

export default Search;
