/**
 * Random Utilities for Human Behavior Simulation
 *
 * SECURITY NOTE: This module intentionally uses Math.random() (PRNG) rather than
 * crypto.getRandomValues() for the following reasons:
 *
 * 1. PURPOSE: These functions simulate human-like behavior patterns (typing delays,
 *    error rates, timing variations). This is NOT a security-sensitive context.
 *
 * 2. PERFORMANCE: Math.random() is significantly faster than cryptographic RNG,
 *    and we may call these functions hundreds of times per engagement session.
 *
 * 3. PREDICTABILITY IS ACCEPTABLE: Even if an attacker could predict the random
 *    values, they would only learn timing patterns of simulated human behavior.
 *    There is no security impact.
 *
 * 4. NO SENSITIVE DATA: These random values are not used for:
 *    - Token/key generation
 *    - Password generation
 *    - Session IDs
 *    - Cryptographic operations
 *    - Access control decisions
 *
 * If you need cryptographically secure randomness elsewhere, use:
 *   import { randomBytes } from 'crypto';
 *   or
 *   crypto.getRandomValues()
 *
 * @module random-utils
 * @security-review-status REVIEWED - Math.random() appropriate for non-security use
 */

/**
 * Generate a random number between 0 and 1 (exclusive)
 * @security Math.random() is intentionally used - see module documentation
 */
export function random(): number {
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return Math.random(); // NOSONAR
}

/**
 * Generate a random integer in range [min, max] (inclusive)
 * @security Math.random() is intentionally used - see module documentation
 */
export function randomInRange(min: number, max: number): number {
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return Math.floor(Math.random() * (max - min + 1)) + min; // NOSONAR
}

/**
 * Generate a random float in range [min, max)
 * @security Math.random() is intentionally used - see module documentation
 */
export function randomFloat(min: number, max: number): number {
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return Math.random() * (max - min) + min; // NOSONAR
}

/**
 * Check if an event should occur based on probability (0-1)
 * @param probability - Value between 0 and 1
 * @security Math.random() is intentionally used - see module documentation
 */
export function shouldOccur(probability: number): boolean {
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return Math.random() < probability; // NOSONAR
}

/**
 * Select a random item from an array
 * @security Math.random() is intentionally used - see module documentation
 */
export function randomChoice<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return items[Math.floor(Math.random() * items.length)]; // NOSONAR
}

/**
 * Select an item based on weighted probability
 * @param options - Array of items with weight property
 * @security Math.random() is intentionally used - see module documentation
 */
export function weightedChoice<T extends { weight: number }>(options: T[]): T | null {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight === 0) return null;

  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  let roll = Math.random() * totalWeight; // NOSONAR

  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option;
    }
  }

  return options[options.length - 1];
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @security Math.random() is intentionally used - see module documentation
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
    const j = Math.floor(Math.random() * (i + 1)); // NOSONAR
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate jitter (random variation) around a base value
 * @param base - Base value
 * @param jitterPercent - Percentage of variation (0-1)
 * @security Math.random() is intentionally used - see module documentation
 */
export function addJitter(base: number, jitterPercent: number = 0.2): number {
  const jitterRange = base * jitterPercent;
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return base + (Math.random() - 0.5) * 2 * jitterRange; // NOSONAR
}

/**
 * Get a random letter (a-z)
 * @security Math.random() is intentionally used - see module documentation
 */
export function randomLetter(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  // NOSONAR - Math.random() is appropriate for behavior simulation (non-security)
  return letters[Math.floor(Math.random() * letters.length)]; // NOSONAR
}
