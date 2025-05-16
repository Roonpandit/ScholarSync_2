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
    // Check if admin accounts already exist
    const admin1Exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    const admin2Exists = await Admin.findOne({ email: process.env.ADMIN2_EMAIL });

    if (admin1Exists && admin2Exists) {
      console.log('Both admin accounts already exist');
      return;
    } else if (admin1Exists) {
      console.log('First admin exists, creating second admin...');
      // Create only second admin if first already exists
      await Admin.create({
        name: ' Elevate Admin',
        email: process.env.ADMIN2_EMAIL,
        password: process.env.ADMIN2_PASSWORD,
        role: 'admin'
      });
      console.log('Second admin account created successfully');
      process.exit();
    } else if (admin2Exists) {
      console.log('Second admin exists, creating first admin...');
      // Create only first admin if second already exists
      await Admin.create({
        name: 'Masai Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log('First admin account created successfully');
      process.exit();
    } else {
      console.log('Creating both admin accounts...');
      // Create both admins if neither exists
      await Admin.create([
        {
          name: 'Masai Admin',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'admin'
        },
        {
          name: ' Elevate Admin',
          email: process.env.ADMIN2_EMAIL,
          password: process.env.ADMIN2_PASSWORD,
          role: 'admin'
        }
      ]);
      console.log('Both admin accounts created successfully');
      process.exit();
    }
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