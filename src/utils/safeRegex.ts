/**
 * Safe regex validation and execution to prevent ReDoS attacks
 */

const MAX_REGEX_LENGTH = 200;

// Dangerous regex patterns that are known to cause ReDoS
const DANGEROUS_PATTERNS = [
  /(\+\*|\*\+|\+\+|\*\*)/,
  /(\{[0-9]+,\}.*\{[0-9]+,\})/,
  /\(([^)]*\+|[^)]*\*)[^)]*\)[\?\*\+]/,
];

export interface RegexValidationResult {
  isValid: boolean;
  error?: string;
  regex?: RegExp;
}

/**
 * Validate a regex pattern for safety
 */
export function validateRegexPattern(pattern: string): RegexValidationResult {
  // Check length
  if (pattern.length > MAX_REGEX_LENGTH) {
    return {
      isValid: false,
      error: `Pattern too long (max ${MAX_REGEX_LENGTH} characters)`,
    };
  }

  // Check for empty pattern
  if (!pattern || pattern.trim().length === 0) {
    return {
      isValid: false,
      error: 'Pattern cannot be empty',
    };
  }

  // Check for dangerous patterns
  for (const dangerousPattern of DANGEROUS_PATTERNS) {
    if (dangerousPattern.test(pattern)) {
      return {
        isValid: false,
        error: 'Pattern contains potentially dangerous constructs',
      };
    }
  }

  // Try to compile the regex
  try {
    const regex = new RegExp(pattern);
    return {
      isValid: true,
      regex,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid regex pattern',
    };
  }
}

export function safeRegexTestSync(pattern: string, input: string): boolean {
  const validation = validateRegexPattern(pattern);
  
  if (!validation.isValid || !validation.regex) {
    return false;
  }

  try {
    return validation.regex.test(input);
  } catch {
    return false;
  }
}
