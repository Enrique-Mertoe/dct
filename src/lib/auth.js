import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

/**
 * Hash a password using Argon2
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
export async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id, // Most secure variant
    memoryCost: 2**16, // 64 MiB
    timeCost: 3, // Number of iterations
    parallelism: 1, // Degree of parallelism
  });
}

/**
 * Verify a password against a hash
 * @param {string} password - The plain text password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} - Whether the password matches the hash
 */
export async function verifyPassword(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a JWT token for a user
 * @param {object} user - The user object to generate a token for
 * @returns {string} - The JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
}

/**
 * Verify a JWT token and return the user data
 * @param {string} token - The JWT token to verify
 * @returns {object|null} - The user data from the token, or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Get user from token
 * @param {string} token - The JWT token
 * @returns {Promise<object|null>} - The user object or null if not found
 */
export async function getUserByToken(token) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    // In a real app, you would fetch the user from the database
    // For now, we'll just return the decoded data
    return decoded;
  } catch (error) {
    console.error('Error getting user by token:', error);
    return null;
  }
}