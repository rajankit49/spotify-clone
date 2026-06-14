require('dotenv').config();
const mongoose = require('mongoose');
const playlistModel = require('./src/models/playlist.model');

async function updatePlaylist() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const newImage = '/images/singer_photo_v2.png';
    const options = { returnDocument: 'after' };

    // Update Playlist named "ashish patel"
    const result = await playlistModel.findOneAndUpdate(
      { title: { $regex: /ashish patel/i } },
      { $set: { coverImage: newImage } },
      options
    );

    console.log('Playlist updated:', result ? result.title : 'Not found');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updatePlaylist();
