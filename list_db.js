require('dotenv').config();
const mongoose = require('mongoose');
const albumModel = require('./src/models/album.model');

async function checkAlbums() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const albums = await albumModel.find({}, 'title');
    console.log('Albums:');
    albums.forEach(a => console.log(a.title));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkAlbums();
