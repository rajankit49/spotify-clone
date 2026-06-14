import api from './api';

export const getAllAlbums = async () => {
  try {
    const response = await api.get('/music/albums');
    return response.data.albums;
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
};

export const getAlbumById = async (albumId) => {
  try {
    const response = await api.get(`/music/albums/${albumId}`);
    return response.data.album;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
};

export const getAllMusic = async () => {
  try {
    const response = await api.get('/music');
    return response.data.musics || [];
  } catch (error) {
    console.error('Error fetching music:', error);
    return [];
  }
};
