/**
 * Input Validation Utilities (V7.0.0)
 *
 * Centralized input validation and length limits for security.
 * Prevents buffer overflow and DoS attacks from oversized inputs.
 *
 * V7.0.0 (M-4): Input length limits for mobile auth screens
 */

// Input length limits - aligned with server-side validation
export const INPUT_LIMITS = {
  EMAIL: 254, // RFC 5321 max email length
  PASSWORD: 128, // Reasonable max for bcrypt
  DISPLAY_NAME: 100,
  PHONE: 20,
  MESSAGE: 5000,
  ADDRESS: 42, // Ethereum address length
} as const;

/**
 * Truncate input to max length
 */
export function truncateInput(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > INPUT_LIMITS.EMAIL) return false;
  // Basic email regex - server does full validation
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

  if (password.length < 8) {
    issues.push('At least 8 characters');
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
