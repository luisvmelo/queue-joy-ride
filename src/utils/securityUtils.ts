
/**
 * Security utility functions for input validation and sanitization
 */

// Phone number validation for Brazilian format
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s()+-]+$/;
  const cleanPhone = phone.replace(/\s/g, '');
  return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

// Sanitize user input to prevent XSS attacks
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"/\\]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length to prevent buffer overflow
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Generate secure session token for customer access
export const generateSecureToken = (): string => {
  return crypto.randomUUID();
};

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Clean up expired rate limit entries
export const cleanupRateLimit = (): void => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
};

// Security headers for API requests
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};
