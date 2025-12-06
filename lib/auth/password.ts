/**
 * Password handling utilities with secure hashing
 * Uses bcryptjs for password hashing with configurable salt rounds
 */

import bcrypt from 'bcryptjs';
import { randomInt, randomBytes } from 'node:crypto';

/**
 * Configuration for password hashing
 */
export interface PasswordConfig {
  /**
   * Number of salt rounds for bcrypt (10-12 recommended for production)
   * Higher values are more secure but slower
   */
  saltRounds: number;

  /**
   * Minimum password length
   */
  minLength: number;

  /**
   * Require at least one uppercase letter
   */
  requireUppercase: boolean;

  /**
   * Require at least one lowercase letter
   */
  requireLowercase: boolean;

  /**
   * Require at least one number
   */
  requireNumber: boolean;

  /**
   * Require at least one special character
   */
  requireSpecial: boolean;
}

/**
 * Result of password validation
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Default password configuration
 */
const defaultConfig: PasswordConfig = {
  saltRounds: 12, // Production-grade security
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Can be enabled for stricter requirements
};

/**
 * Current configuration (can be overridden)
 */
let currentConfig: PasswordConfig = { ...defaultConfig };

/**
 * Configure password handling settings
 * @param config Partial configuration to merge with defaults
 */
export function configurePassword(config: Partial<PasswordConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current password configuration
 */
export function getPasswordConfig(): PasswordConfig {
  return { ...currentConfig };
}

/**
 * Validate a password against the configured requirements
 * @param password The password to validate
 * @returns Validation result with any errors
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < currentConfig.minLength) {
    errors.push(`Password must be at least ${currentConfig.minLength} characters long`);
  }

  if (currentConfig.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (currentConfig.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (currentConfig.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (currentConfig.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash a password using bcrypt
 * @param password The plaintext password to hash
 * @returns Promise resolving to the hashed password
 * @throws Error if password validation fails
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
  }

  const salt = await bcrypt.genSalt(currentConfig.saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 * @param password The plaintext password to verify
 * @param hash The bcrypt hash to verify against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // Log error in development, but don't expose details
    if (process.env.NODE_ENV === 'development') {
      console.error('Password verification error');
    }
    return false;
  }
}

/**
 * Synchronous version of hashPassword (use sparingly, blocks event loop)
 * @param password The plaintext password to hash
 * @returns The hashed password
 */
export function hashPasswordSync(password: string): string {
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
  }

  const salt = bcrypt.genSaltSync(currentConfig.saltRounds);
  return bcrypt.hashSync(password, salt);
}

/**
 * Synchronous version of verifyPassword (use sparingly, blocks event loop)
 * @param password The plaintext password to verify
 * @param hash The bcrypt hash to verify against
 * @returns True if password matches, false otherwise
 */
export function verifyPasswordSync(password: string, hash: string): boolean {
  if (!password || !hash) {
    return false;
  }

  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

/**
 * Check if a hash needs to be rehashed (e.g., if salt rounds changed)
 * @param hash The bcrypt hash to check
 * @returns True if the hash should be regenerated
 */
export function needsRehash(hash: string): boolean {
  if (!hash) {
    return true;
  }

  try {
    // Extract rounds from bcrypt hash ($2a$XX$...)
    const rounds = bcrypt.getRounds(hash);
    return rounds < currentConfig.saltRounds;
  } catch {
    return true;
  }
}

/**
 * Generate a secure random password
 * @param length Length of the password (default: 16)
 * @returns A randomly generated password meeting all requirements
 */

function secureRandomIndex(max: number): number {
  if (max <= 0) {
    throw new Error('max must be greater than 0');
  }
  if (max > 0xffffffff) {
    throw new Error('max must not exceed 2^32');
  }

  // Use rejection sampling to eliminate modulo bias
  const threshold = 0x100000000 - (0x100000000 % max);
  let randomValue: number;

  do {
    const randomBuffer = randomBytes(4);
    randomValue = randomBuffer.readUInt32BE(0);
  } while (randomValue >= threshold);

  return randomValue % max;
}

export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure minimum requirements
  const minLength = Math.max(length, currentConfig.minLength);
  const chars: string[] = [];

  // Add required character types using cryptographically secure random
  if (currentConfig.requireUppercase) {
    chars.push(uppercase[randomInt(uppercase.length)]);
  }
  if (currentConfig.requireLowercase) {
    chars.push(lowercase[randomInt(lowercase.length)]);
  }
  if (currentConfig.requireNumber) {
    chars.push(numbers[randomInt(numbers.length)]);
  }
  if (currentConfig.requireSpecial) {
    chars.push(special[randomInt(special.length)]);
  }

  // Fill remaining with random characters from all allowed sets
  const allChars = uppercase + lowercase + numbers + (currentConfig.requireSpecial ? special : '');
  while (chars.length < minLength) {
    chars.push(allChars[randomInt(allChars.length)]);
  }

  // Shuffle the array using cryptographically secure random
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
