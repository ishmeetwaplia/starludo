// seedAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/User"); // adjust path if needed

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@example.com";
    const password = "Admin@123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role: "admin" });
    if (existingAdmin) {
      console.log("✅ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      phone: "0000000000", // 👈 dummy unique phone
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await admin.save();
    console.log("✅ Admin seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
    process.exit(1);
  }
};

seedAdmin();
