const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create admin account
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL && process.env.ADMIN2_EMAIL });

    if (adminExists) {
      console.log('Admin account already exists');
      return;
    }

    // Create admin accounts
    await Admin.create([
      {
        name: 'Masai Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      },
      {
        name: ' Elevate Admin',
        email: process.env.ADMIN2_EMAIL,
        password: process.env.ADMIN2_PASSWORD,
        role: 'admin',
      }
    ]);

    console.log('Admin accounts created successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete existing data
const deleteData = async () => {
  try {
    await Admin.deleteMany();
    console.log('All admin data deleted');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run command based on argument
if (process.argv[2] === '-d') {
  deleteData();
} else {
  createAdmin();
}