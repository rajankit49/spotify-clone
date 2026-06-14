import api from './api';

export const globalSearch = async (query) => {
  if (!query) return { musics: [], albums: [], playlists: [] };
  
  try {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    // Backend returns: { results: { musics, albums, playlists } }
    return response.data.results || { musics: [], albums: [], playlists: [] };
  } catch (error) {
    console.error('Error fetching search results:', error);
    return { musics: [], albums: [], playlists: [] };
  }
};
