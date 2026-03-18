import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PlatformUser } from "@enterprise-commerce/core/platform/types"
import openDb from '../db/db';
import { DevBundlerService } from 'next/dist/server/lib/dev-bundler-service';

type UserInput = {
  email: string
  password: string
};

export const createUser = async(input: UserInput) => {
  const db = await openDb();

  try{
    // 1. Validate input
  if (!input.email || !input.password) {
    throw new Error("Missing email or password");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // 2. Check if user exists

  const existingUser = await db.get<PlatformUser>(
    'SELECT * FROM users WHERE email = ?',
    input.email
  );

  if (existingUser) {
    throw new Error("User already exists");
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(input.password, 12);

  // 4. Store user
  // 5. Insert into DB
  await db.run(
    `INSERT INTO users (email, password_hash)
      VALUES (?, ?)`,
    input.email,
    passwordHash
  );


  // 5. Return safe object
  return {
    email: input.email
  };
}
finally{
  await db.close();
}
} 

export const findUserById = async (id: string): Promise<PlatformUser | null> => {
  const db = await openDb();
  const user = await db.get<PlatformUser>('SELECT * FROM users WHERE id = ?', id);
  await db.close();
  return user || null;
};

/**
 * Compares a plain text password with a hashed password.
 *
 * This function uses bcrypt to asynchronously compare a plain text password with a hashed password 
 * to determine if they match.
 *
 * @param {string} password - The plain text password to be compared. (input from user when trying to login)
 * @param {string} hashedPassword - The hashed password to compare against. (encrypted password stored in database)
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the passwords match, 
 *                               and `false` otherwise.
 */
export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword); 
};
