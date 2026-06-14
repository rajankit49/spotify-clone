require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('./src/models/user.model');

async function promote() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node promote_user.js <email>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB:', mongoose.connection.name);

    const user = await userModel.findOne({ email: email });
    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    user.role = 'artist';
    await user.save();

    console.log(`Successfully promoted "${user.username}" (${user.email}) to role "artist"!`);
    process.exit(0);
  } catch (err) {
    console.error('Promotion error:', err.message);
    process.exit(1);
  }
}

promote();
