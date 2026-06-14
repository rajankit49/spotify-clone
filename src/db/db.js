const mongoose = require('mongoose');

async function connectDB() {

    try{

        await mongoose.connect(process.env.MONGO_URI)
        console.log('Database connected successfully');
         console.log("Connected to DB:", mongoose.connection.name);
    }

    catch(error) {
        console.error('databse connection error:', error);
    }
}

module.exports = connectDB;