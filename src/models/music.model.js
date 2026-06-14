const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    uri:{
        type: String,
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", //at the end artist is also ia user
        required: true,
    },
    coverImage: {
        type: String,
        default: ""
    },
    saavnId: {
        type: String,
        default: ""
    },
    spotifyId: {
        type: String,
        default: ""
    }
})

const musicModel = mongoose.model("music", musicSchema);

module.exports = musicModel;