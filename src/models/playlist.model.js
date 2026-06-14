const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    musics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "music"
    }],
    isPublic: {
        type: Boolean,
        default: true,
    },
    coverImage: {
        type: String,
        default: ""
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }]
}, { timestamps: true });

const playlistModel = mongoose.model("playlist", playlistSchema);

module.exports = playlistModel;
