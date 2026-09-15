import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bdu_cms';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@buddhadana.com';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seed() {
  try {
    if (!ADMIN_PASSWORD) {
      console.error('ERROR: ADMIN_PASSWORD environment variable is required for seeding');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existingAdmin) {
      console.log(`Admin account already exists: ${ADMIN_EMAIL}`);
      console.log('No changes made.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    });

    console.log(`Admin account created successfully:`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
