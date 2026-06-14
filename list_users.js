require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('./src/models/user.model');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB:', mongoose.connection.name);
    
    const users = await userModel.find({}, 'username email role');
    console.log('\nRegistered Users in Database:');
    if (users.length === 0) {
      console.log('No users found in the database. Please register first!');
    } else {
      users.forEach((u, idx) => {
        console.log(`${idx + 1}. Username: "${u.username}", Email: "${u.email}", Role: "${u.role}"`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('Database query error:', err);
    process.exit(1);
  }
}
checkUsers();
