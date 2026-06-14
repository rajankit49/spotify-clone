const express =require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes =require('./routes/auth.routes');
const musicRoutes = require('./routes/music.routes');
const playlistRoutes = require('./routes/playlist.routes');
const userActionRoutes = require('./routes/userAction.routes');
const searchRoutes = require('./routes/search.routes');



const app=express()

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow our Vite frontend
    credentials: true // Allow cookies to be sent back and forth
}));

app.use(express.json()); //to get data in req.body
app.use(cookieParser()); //to  read cookie data


app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/user', userActionRoutes);
app.use('/api/search', searchRoutes);
module.exports=app;