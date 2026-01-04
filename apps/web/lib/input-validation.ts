/**
 * Input Validation Utilities (V8.0.0)
 *
 * Centralized input validation and length limits for security.
 * Prevents buffer overflow and DoS attacks from oversized inputs.
 */

import { z } from 'zod';

// Input length limits - aligned with server-side validation
export const INPUT_LIMITS = {
  EMAIL: 254,          // RFC 5321 max email length
  PASSWORD: 128,       // Reasonable max for bcrypt
  PASSWORD_MIN: 8,     // Minimum password length
  DISPLAY_NAME: 100,
  PHONE: 20,
  MESSAGE: 5000,
  ADDRESS: 42,         // Ethereum address length
  BIO: 500,
  URL: 2048,
  SEARCH_QUERY: 200,
} as const;

/**
 * Truncate input to max length
 */
export function truncateInput(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}

/**
 * Zod schemas with proper length limits
 */
export const validationSchemas = {
  email: z
    .string()
    .min(1, 'Email is required')
    .max(INPUT_LIMITS.EMAIL, `Email must be ${INPUT_LIMITS.EMAIL} characters or less`)
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(INPUT_LIMITS.PASSWORD_MIN, `Password must be at least ${INPUT_LIMITS.PASSWORD_MIN} characters`)
    .max(INPUT_LIMITS.PASSWORD, `Password must be ${INPUT_LIMITS.PASSWORD} characters or less`),

  passwordWithComplexity: z
    .string()
    .min(INPUT_LIMITS.PASSWORD_MIN, `Password must be at least ${INPUT_LIMITS.PASSWORD_MIN} characters`)
    .max(INPUT_LIMITS.PASSWORD, `Password must be ${INPUT_LIMITS.PASSWORD} characters or less`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(INPUT_LIMITS.DISPLAY_NAME, `Name must be ${INPUT_LIMITS.DISPLAY_NAME} characters or less`),

  phone: z
    .string()
    .max(INPUT_LIMITS.PHONE, `Phone number must be ${INPUT_LIMITS.PHONE} characters or less`)
    .regex(/^[+]?[\d\s()-]+$/, 'Please enter a valid phone number')
    .optional(),

  message: z
    .string()
    .max(INPUT_LIMITS.MESSAGE, `Message must be ${INPUT_LIMITS.MESSAGE} characters or less`),

  bio: z
    .string()
    .max(INPUT_LIMITS.BIO, `Bio must be ${INPUT_LIMITS.BIO} characters or less`)
    .optional(),

  url: z
    .string()
    .max(INPUT_LIMITS.URL, `URL must be ${INPUT_LIMITS.URL} characters or less`)
    .url('Please enter a valid URL')
    .optional(),

  ethereumAddress: z
    .string()
    .length(INPUT_LIMITS.ADDRESS, 'Invalid Ethereum address')
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address format'),

  searchQuery: z
    .string()
    .max(INPUT_LIMITS.SEARCH_QUERY, `Search query must be ${INPUT_LIMITS.SEARCH_QUERY} characters or less`),
} as const;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > INPUT_LIMITS.EMAIL) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password meets requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (password.length < INPUT_LIMITS.PASSWORD_MIN) {
    issues.push(`At least ${INPUT_LIMITS.PASSWORD_MIN} characters`);
  }
  if (password.length > INPUT_LIMITS.PASSWORD) {
    issues.push(`Maximum ${INPUT_LIMITS.PASSWORD} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('One number');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Check if display name is valid
 */
export function isValidDisplayName(name: string): boolean {
  if (!name || name.length > INPUT_LIMITS.DISPLAY_NAME) return false;
  return name.trim().length >= 2;
}
