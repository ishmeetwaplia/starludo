// seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./src/models/Admin"); 

const seedAdmin = async () => {
  try {
    // connect to Mongo
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // check if admin already exists
    const existing = await Admin.findOne({ email: "admin@example.com" });
    if (existing) {
      console.log("⚠️ Admin already exists:", existing.email);
      process.exit(0);
    }

    // create new admin
    const admin = new Admin({
      email: "admin@example.com",
      password: "Admin@123", 
    });

    await admin.save();
    console.log("🎉 Admin created successfully!");
    console.log("👉 Use these credentials to login:");
    console.log("   Email: admin@example.com");
    console.log("   Password: Admin@123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
