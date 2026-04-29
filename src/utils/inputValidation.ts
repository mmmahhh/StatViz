/**
 * Input validation utilities for cell editing
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string | number | null;
}

/**
 * Validate and sanitize cell input
 */
export function validateCellInput(
  value: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _columnName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _originalValue: string | number | null
): ValidationResult {
  // Empty string is valid (null)
  if (value.trim() === '') {
    return {
      isValid: true,
      sanitizedValue: null,
    };
  }

  // Try to parse as number
  const numValue = parseFloat(value);
  
  if (!isNaN(numValue) && isFinite(numValue)) {
    // Valid number - check bounds
    const MAX_SAFE_NUMBER = 1e15;
    const MIN_SAFE_NUMBER = -1e15;
    
    if (numValue > MAX_SAFE_NUMBER || numValue < MIN_SAFE_NUMBER) {
      return {
        isValid: false,
        error: `Value out of safe range (${MIN_SAFE_NUMBER} to ${MAX_SAFE_NUMBER})`,
      };
    }
    
    return {
      isValid: true,
      sanitizedValue: numValue,
    };
  }

  // Not a number - validate as string
  const MAX_STRING_LENGTH = 1000;
  
  if (value.length > MAX_STRING_LENGTH) {
    return {
      isValid: false,
      error: `Text too long (max ${MAX_STRING_LENGTH} characters)`,
    };
  }

  // Check for potentially dangerous characters
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      return {
        isValid: false,
        error: 'Input contains potentially unsafe content',
      };
    }
  }

  return {
    isValid: true,
    sanitizedValue: value.trim(),
  };
}

/**
 * Validate numeric input with optional min/max bounds
 */
export function validateNumericInput(
  value: string,
  options?: {
    min?: number;
    max?: number;
    allowNull?: boolean;
  }
): ValidationResult {
  const { min, max, allowNull = true } = options || {};

  if (value.trim() === '') {
    if (allowNull) {
      return { isValid: true, sanitizedValue: null };
    }
    return { isValid: false, error: 'Value is required' };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue) || !isFinite(numValue)) {
    return {
      isValid: false,
      error: 'Must be a valid number',
    };
  }

  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      error: `Value must be at least ${min}`,
    };
  }

  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      error: `Value must be at most ${max}`,
    };
  }

  return {
    isValid: true,
    sanitizedValue: numValue,
  };
}
