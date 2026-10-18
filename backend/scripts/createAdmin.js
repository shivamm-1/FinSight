require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDatabase = require("../src/config/database");
const User = require("../src/models/user.js");

async function createAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !email || !password) {
      throw new Error(
        "Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in .env",
      );
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new Error(
        "Admin username must be 3–30 characters and contain only letters, numbers, and underscores",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid admin email address");
    }

    if (password.length < 8 || password.length > 72) {
      throw new Error("Admin password must contain 8–72 characters");
    }

    await connectDatabase();

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new Error(
        "A user with this username or email already exists. No account was changed.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      username,
      email,
      passwordHash,
      role: "admin",
    });

    console.log("Admin account created successfully.");
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log("Keep the credentials private.");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
