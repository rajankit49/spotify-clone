require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/db/db');
const userModel = require('./src/models/user.model');

// Connect to Database
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow Vite frontend
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Track online users: userId -> socketId
const onlineUsers = new Map();

// Track active Jam rooms: roomCode -> roomState
const jamRooms = new Map();

// Helper to generate Jam Room Code
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user
    socket.on('register', (userId) => {
        if (userId) {
            onlineUsers.set(userId, socket.id);
            socket.userId = userId;
            console.log(`User registered: ${userId} with socket ${socket.id}`);
        }
    });

    // Handle user playing a song (Friend Activity)
    socket.on('play_song', async ({ userId, song }) => {
        if (!userId || !song) return;
        try {
            const user = await userModel.findById(userId).populate('followers');
            if (user && user.followers) {
                user.followers.forEach(follower => {
                    const followerSocketId = onlineUsers.get(follower._id.toString());
                    if (followerSocketId) {
                        io.to(followerSocketId).emit('friend_playing', {
                            friend: {
                                _id: user._id,
                                username: user.username,
                                email: user.email
                            },
                            song
                        });
                    }
                });
            }
        } catch (err) {
            console.error('Error broadcasting play_song:', err.message);
        }
    });

    // Create a Jam room
    socket.on('create_jam', ({ hostId, username }) => {
        if (!hostId) return;
        
        let roomCode = generateRoomCode();
        while (jamRooms.has(roomCode)) {
            roomCode = generateRoomCode();
        }

        const roomState = {
            roomCode,
            hostId,
            hostUsername: username,
            hostSocketId: socket.id,
            currentSong: null,
            isPlaying: false,
            progress: 0,
            queue: [],
            members: [{ userId: hostId, username, socketId: socket.id }]
        };

        jamRooms.set(roomCode, roomState);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        socket.emit('jam_created', roomState);
        console.log(`Jam Room Created: ${roomCode} by host ${username}`);
    });

    // Join a Jam room
    socket.on('join_jam', ({ roomCode, userId, username }) => {
        if (!roomCode || !userId) return;
        
        const code = roomCode.toUpperCase();
        const room = jamRooms.get(code);

        if (!room) {
            socket.emit('jam_error', { message: 'Jam session not found.' });
            return;
        }

        // Add member if not already in list
        const exists = room.members.some(m => m.userId === userId);
        if (!exists) {
            room.members.push({ userId, username, socketId: socket.id });
        } else {
            // Update socket ID
            room.members = room.members.map(m => m.userId === userId ? { ...m, socketId: socket.id } : m);
        }

        socket.join(code);
        socket.roomCode = code;

        // Notify member and other members
        socket.emit('jam_joined', room);
        io.to(code).emit('jam_update', room);
        io.to(code).emit('toast_message', { message: `${username} joined the Jam!` });
        console.log(`User ${username} joined Jam room: ${code}`);
    });

    // Leave a Jam room
    socket.on('leave_jam', ({ roomCode, userId, username }) => {
        if (!roomCode) return;
        const code = roomCode.toUpperCase();
        const room = jamRooms.get(code);

        if (room) {
            room.members = room.members.filter(m => m.userId !== userId);
            socket.leave(code);
            socket.roomCode = null;

            if (room.members.length === 0 || room.hostId === userId) {
                // If host leaves or no members, close the room
                jamRooms.delete(code);
                io.to(code).emit('jam_closed', { message: 'Jam session has ended by host.' });
                console.log(`Jam room ${code} closed.`);
            } else {
                io.to(code).emit('jam_update', room);
                io.to(code).emit('toast_message', { message: `${username} left the Jam.` });
                console.log(`User ${username} left Jam room: ${code}`);
            }
        }
    });

    // Sync state (called by host or guest changing state)
    socket.on('jam_state_change', ({ roomCode, isPlaying, progress, currentSong, queue }) => {
        if (!roomCode) return;
        const code = roomCode.toUpperCase();
        const room = jamRooms.get(code);

        if (room) {
            room.isPlaying = isPlaying !== undefined ? isPlaying : room.isPlaying;
            room.progress = progress !== undefined ? progress : room.progress;
            room.currentSong = currentSong !== undefined ? currentSong : room.currentSong;
            room.queue = queue !== undefined ? queue : room.queue;

            // Broadcast the state update to everyone in the room
            io.to(code).emit('jam_state_updated', {
                isPlaying: room.isPlaying,
                progress: room.progress,
                currentSong: room.currentSong,
                queue: room.queue
            });
        }
    });

    // Request queue sync
    socket.on('jam_add_to_queue', ({ roomCode, song }) => {
        if (!roomCode || !song) return;
        const code = roomCode.toUpperCase();
        const room = jamRooms.get(code);

        if (room) {
            room.queue.push(song);
            io.to(code).emit('jam_queue_updated', room.queue);
            io.to(code).emit('toast_message', { message: `New song added to queue: ${song.title}` });
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Remove from online users
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
        }

        // Handle leaving active Jam room if any
        if (socket.roomCode) {
            const code = socket.roomCode;
            const room = jamRooms.get(code);
            if (room) {
                room.members = room.members.filter(m => m.socketId !== socket.id);
                if (room.members.length === 0 || room.hostSocketId === socket.id) {
                    jamRooms.delete(code);
                    io.to(code).emit('jam_closed', { message: 'Jam session has ended by host.' });
                } else {
                    io.to(code).emit('jam_update', room);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});