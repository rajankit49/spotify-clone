const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    username:{
        type: String, 
        required: true,
        unique: true,
    },

    email: {
        type: String, 
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required : true,
    },

    role: {
        type: String,
        enum: ['user', 'artist'],
        default: 'user',
    },

    likedSongs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "music"
    }],

    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    history: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "music"
    }]

})

const userModel = mongoose.model("user",userSchema)

module.exports = userModel;