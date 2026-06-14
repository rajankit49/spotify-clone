import api from './api';

export const getMyPlaylists = async () => {
  try {
    const response = await api.get('/playlist');
    return response.data.playlists || [];
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
};

export const createPlaylist = async (title) => {
  try {
    const response = await api.post('/playlist', { title });
    return response.data.playlist;
  } catch (error) {
    console.error('Error creating playlist:', error);
    return null;
  }
};

export const getPlaylistById = async (playlistId) => {
  try {
    const response = await api.get(`/playlist/${playlistId}`);
    return response.data.playlist;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return null;
  }
};

export const addSongToPlaylist = async (playlistId, musicId) => {
  try {
    const response = await api.post(`/playlist/${playlistId}/music/${musicId}`);
    return response.data;
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return null;
  }
};

export const removeSongFromPlaylist = async (playlistId, musicId) => {
  try {
    const response = await api.delete(`/playlist/${playlistId}/music/${musicId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return null;
  }
};

export const updatePlaylist = async (playlistId, formData) => {
  try {
    const response = await api.put(`/playlist/${playlistId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.playlist;
  } catch (error) {
    console.error('Error updating playlist:', error);
    return null;
  }
};
