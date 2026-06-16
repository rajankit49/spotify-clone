require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userModel = require('./src/models/user.model');
const musicModel = require('./src/models/music.model');
const albumModel = require('./src/models/album.model');

// Stable streaming audio links (SoundHelix + Archive.org)
const AUDIO_LINKS = {
  song1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  song2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  song3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  song4: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  song5: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  song6: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  song7: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  song8: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  song9: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  song10: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
};

// Cover images (actual singer photos & album cover)
const COVERS = {
  kishore: 'https://c.saavncdn.com/artists/Kishore_Kumar_500x500.jpg',
  arijit: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg',
  neha: 'https://c.saavncdn.com/artists/Neha_Kakkar_007_20241212115832_500x500.jpg',
  ghulam: 'https://c.saavncdn.com/artists/Ghulam_Ali_500x500.jpg',
  lata: 'https://c.saavncdn.com/artists/Lata_Mangeshkar_500x500.jpg',
  veer_zaara: 'https://c.saavncdn.com/313/Veer-Zaara-Hindi-2004-20190329150841-500x500.jpg',
};

async function resolveActualAudioLink(title, artistName, fallbackLink) {
    const query = `${title} ${artistName}`;
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.data?.results?.[0]) {
                const track = data.data.results[0];
                let streamLink = track.downloadUrl.find(d => d.quality === '160kbps')?.url || track.downloadUrl[track.downloadUrl.length - 1]?.url;
                if (streamLink && streamLink.startsWith('http://')) {
                    streamLink = streamLink.replace('http://', 'https://');
                }
                if (streamLink) {
                    console.log(`Resolved real track for "${title}" by ${artistName}`);
                    return streamLink;
                }
            }
        }
    } catch (err) {
        console.error(`Error resolving real track for "${title}":`, err.message);
    }
    return fallbackLink;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', mongoose.connection.name);

    // Clear only seeded Musics and Albums to avoid wiping user-uploaded tracks
    const seededArtists = await userModel.find({
      $or: [
        { email: /@spotify\.com$/i },
        { email: /@saavn\.com$/i }
      ]
    });
    const seededArtistIds = seededArtists.map(a => a._id);
    await musicModel.deleteMany({ artist: { $in: seededArtistIds } });
    await albumModel.deleteMany({ artist: { $in: seededArtistIds } });
    console.log('Cleared seeded music and album data (user-uploaded content preserved).');

    const hash = await bcrypt.hash('password123', 10);

    // 1. Create or Find Artist Users
    const artistsData = [
      { username: 'Kishore Kumar', email: 'kishore@spotify.com', password: hash, role: 'artist' },
      { username: 'Arijit Singh', email: 'arijit@spotify.com', password: hash, role: 'artist' },
      { username: 'Neha Kakkar', email: 'neha@spotify.com', password: hash, role: 'artist' },
      { username: 'Ghulam Ali', email: 'ghulam@spotify.com', password: hash, role: 'artist' },
      { username: 'Lata Mangeshkar', email: 'lata@spotify.com', password: hash, role: 'artist' }
    ];

    const artists = {};
    for (const art of artistsData) {
      let user = await userModel.findOne({ email: art.email });
      if (!user) {
        user = await userModel.create(art);
        console.log(`Created artist: ${user.username}`);
      } else {
        console.log(`Artist already exists: ${user.username}`);
      }
      artists[user.username] = user;
    }

    // 2. Create Songs
    const songsToCreate = [
      // Kishore Kumar
      { title: 'Zindagi Ek Safar', artistName: 'Kishore Kumar', fallback: AUDIO_LINKS.song1, coverImage: COVERS.kishore, artist: artists['Kishore Kumar']._id },
      { title: 'O Saathi Re', artistName: 'Kishore Kumar', fallback: AUDIO_LINKS.song2, coverImage: COVERS.kishore, artist: artists['Kishore Kumar']._id },
      { title: 'Ek Ladki Bheegi Bhaagi Si', artistName: 'Kishore Kumar', fallback: AUDIO_LINKS.song3, coverImage: COVERS.kishore, artist: artists['Kishore Kumar']._id },

      // Arijit Singh
      { title: 'Tum Hi Ho', artistName: 'Arijit Singh', fallback: AUDIO_LINKS.song4, coverImage: COVERS.arijit, artist: artists['Arijit Singh']._id },
      { title: 'Channa Mereya', artistName: 'Arijit Singh', fallback: AUDIO_LINKS.song5, coverImage: COVERS.arijit, artist: artists['Arijit Singh']._id },

      // Neha Kakkar
      { title: 'Dilbar', artistName: 'Neha Kakkar', fallback: AUDIO_LINKS.song6, coverImage: COVERS.neha, artist: artists['Neha Kakkar']._id },
      { title: 'Mile Ho Tum', artistName: 'Neha Kakkar', fallback: AUDIO_LINKS.song7, coverImage: COVERS.neha, artist: artists['Neha Kakkar']._id },

      // Ghulam Ali
      { title: 'Hungama Hai Kyon Barpa', artistName: 'Ghulam Ali', fallback: AUDIO_LINKS.song8, coverImage: COVERS.ghulam, artist: artists['Ghulam Ali']._id },
      { title: 'Chupke Chupke Raat Din', artistName: 'Ghulam Ali', fallback: AUDIO_LINKS.song9, coverImage: COVERS.ghulam, artist: artists['Ghulam Ali']._id },

      // Lata Mangeshkar
      { title: 'Tere Liye', artistName: 'Lata Mangeshkar', fallback: AUDIO_LINKS.song10, coverImage: COVERS.lata, artist: artists['Lata Mangeshkar']._id },
      { title: 'Lag Jaa Gale', artistName: 'Lata Mangeshkar', fallback: AUDIO_LINKS.song1, coverImage: COVERS.lata, artist: artists['Lata Mangeshkar']._id },
    ];

    const songsData = [];
    for (const song of songsToCreate) {
        const uri = await resolveActualAudioLink(song.title, song.artistName, song.fallback);
        songsData.push({
            title: song.title,
            uri,
            coverImage: song.coverImage,
            artist: song.artist,
            status: 'approved'
        });
    }

    const createdSongs = await musicModel.insertMany(songsData);
    console.log(`Successfully seeded ${createdSongs.length} songs.`);

    // Helper to find song ID by title
    const getSongId = (title) => createdSongs.find(s => s.title === title)._id;

    // 3. Create Albums
    const albumsData = [
      {
        title: 'Best of Kishore Kumar',
        coverImage: COVERS.kishore,
        artist: artists['Kishore Kumar']._id,
        musics: [getSongId('Zindagi Ek Safar'), getSongId('O Saathi Re'), getSongId('Ek Ladki Bheegi Bhaagi Si')]
      },
      {
        title: 'Arijit Singh Hits',
        coverImage: COVERS.arijit,
        artist: artists['Arijit Singh']._id,
        musics: [getSongId('Tum Hi Ho'), getSongId('Channa Mereya')]
      },
      {
        title: 'Veer - Zaara',
        coverImage: COVERS.veer_zaara,
        artist: artists['Lata Mangeshkar']._id,
        musics: [getSongId('Tere Liye'), getSongId('Lag Jaa Gale')]
      }
    ];

    const createdAlbums = await albumModel.insertMany(albumsData);
    console.log(`Successfully seeded ${createdAlbums.length} albums.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
