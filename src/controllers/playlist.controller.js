const playlistModel = require('../models/playlist.model');
const musicModel = require('../models/music.model');
const { uploadFile } = require('../services/storage.service');

async function createPlaylist(req, res) {
    try {
        const { title, description, isPublic } = req.body;
        
        const playlist = await playlistModel.create({
            title,
            description,
            isPublic: isPublic !== undefined ? isPublic : true,
            owner: req.user.id
        });

        res.status(201).json({
            message: "Playlist created successfully",
            playlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const userModel = require('../models/user.model');

async function addMusicToPlaylist(req, res) {
    try {
        const { playlistId, musicId } = req.params;

        const playlist = await playlistModel.findOne({ 
            _id: playlistId, 
            $or: [
                { owner: req.user.id },
                { collaborators: req.user.id }
            ]
        });
        if (!playlist) return res.status(404).json({ message: "Playlist not found or you do not have permission" });

        if (!playlist.musics.includes(musicId)) {
            playlist.musics.push(musicId);
            await playlist.save();
        }

        res.status(200).json({
            message: "Music added to playlist",
            playlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function removeMusicFromPlaylist(req, res) {
    try {
        const { playlistId, musicId } = req.params;

        const playlist = await playlistModel.findOne({ 
            _id: playlistId, 
            $or: [
                { owner: req.user.id },
                { collaborators: req.user.id }
            ]
        });
        if (!playlist) return res.status(404).json({ message: "Playlist not found or you do not have permission" });

        playlist.musics = playlist.musics.filter(id => id.toString() !== musicId);
        await playlist.save();

        res.status(200).json({
            message: "Music removed from playlist",
            playlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getUserPlaylists(req, res) {
    try {
        const playlists = await playlistModel.find({ 
            $or: [
                { owner: req.user.id },
                { collaborators: req.user.id }
            ]
        }).populate('owner', 'username');
        res.status(200).json({ playlists });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getPlaylistById(req, res) {
    try {
        const { playlistId } = req.params;
        const playlist = await playlistModel.findById(playlistId)
            .populate('owner', 'username')
            .populate('collaborators', 'username email')
            .populate({
                path: 'musics',
                populate: { path: 'artist', select: 'username email' }
            });
        
        if (!playlist) return res.status(404).json({ message: "Playlist not found" });

        // If it's private, only the owner or collaborators can see it
        if (!playlist.isPublic && playlist.owner._id.toString() !== req.user.id && !playlist.collaborators.some(c => c._id.toString() === req.user.id)) {
            return res.status(403).json({ message: "This playlist is private" });
        }

        res.status(200).json({ playlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function updatePlaylist(req, res) {
    try {
        const { playlistId } = req.params;
        const { title, description, isPublic } = req.body;
        const file = req.file;

        // Only owner can update playlist details
        const playlist = await playlistModel.findOne({ _id: playlistId, owner: req.user.id });
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found or you are not the owner" });
        }

        if (title !== undefined) playlist.title = title;
        if (description !== undefined) playlist.description = description;
        if (isPublic !== undefined) playlist.isPublic = (isPublic === 'true' || isPublic === true);

        if (file) {
            const result = await uploadFile(file.buffer.toString('base64'));
            playlist.coverImage = result.url;
        }

        await playlist.save();

        res.status(200).json({
            message: "Playlist updated successfully",
            playlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function addCollaborator(req, res) {
    try {
        const { playlistId } = req.params;
        const { username } = req.body;

        const playlist = await playlistModel.findOne({ _id: playlistId, owner: req.user.id });
        if (!playlist) return res.status(404).json({ message: "Playlist not found or you are not the owner" });

        const userToInvite = await userModel.findOne({ username });
        if (!userToInvite) return res.status(404).json({ message: "User not found" });

        if (userToInvite._id.toString() === req.user.id) {
            return res.status(400).json({ message: "You are already the owner of this playlist" });
        }

        if (playlist.collaborators.includes(userToInvite._id)) {
            return res.status(400).json({ message: "User is already a collaborator" });
        }

        playlist.collaborators.push(userToInvite._id);
        await playlist.save();

        const updatedPlaylist = await playlistModel.findById(playlistId)
            .populate('owner', 'username')
            .populate('collaborators', 'username email');

        res.status(200).json({
            message: "Collaborator added successfully",
            playlist: updatedPlaylist
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function removeCollaborator(req, res) {
    try {
        const { playlistId } = req.params;
        const { userId } = req.body;

        const playlist = await playlistModel.findOne({ _id: playlistId, owner: req.user.id });
        if (!playlist) return res.status(404).json({ message: "Playlist not found or you are not the owner" });

        playlist.collaborators = playlist.collaborators.filter(id => id.toString() !== userId);
        await playlist.save();

        const updatedPlaylist = await playlistModel.findById(playlistId)
            .populate('owner', 'username')
            .populate('collaborators', 'username email');

        res.status(200).json({
            message: "Collaborator removed successfully",
            playlist: updatedPlaylist
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { 
    createPlaylist, 
    addMusicToPlaylist, 
    removeMusicFromPlaylist, 
    getUserPlaylists, 
    getPlaylistById, 
    updatePlaylist,
    addCollaborator,
    removeCollaborator
};
