// Unit tests for utility functions

const {
  validateEmail,
  validatePassword,
  sanitizeString,
  slugify,
  generateRandomString,
  calculateReadTime,
  formatDate,
} = require('../../src/utils/helpers');

describe('Unit: Utility Functions', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'email@123.123.123.123', // IP address
        'test@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'test@',
        'test..test@domain.com', // double dots
        'test@domain',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      const validPasswords = [
        'password123',
        'Test1234',
        'myPassword1',
        '12345abc',
        'ComplexP@ss1',
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it('should return false for invalid passwords', () => {
      const invalidPasswords = [
        'password', // no number
        '12345678', // no letter
        'pass1', // too short
        '', // empty
        'PASSWORD123', // no lowercase (if regex requires it)
      ];

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters and trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('normal text')).toBe('normal text');
      expect(sanitizeString('')).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString({})).toBe('');
    });
  });

  describe('slugify', () => {
    it('should convert text to URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('JavaScript Testing & Debugging')).toBe('javascript-testing-debugging');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Special!@#$%^&*()Characters')).toBe('specialcharacters');
      expect(slugify('UPPERCASE TEXT')).toBe('uppercase-text');
    });

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('');
      expect(slugify('---')).toBe('');
      expect(slugify('123')).toBe('123');
      expect(slugify('café')).toBe('caf');
    });
  });

  describe('generateRandomString', () => {
    it('should generate strings of specified length', () => {
      expect(generateRandomString(10)).toHaveLength(10);
      expect(generateRandomString(32)).toHaveLength(32);
      expect(generateRandomString(1)).toHaveLength(1);
    });

    it('should generate different strings on each call', () => {
      const str1 = generateRandomString(20);
      const str2 = generateRandomString(20);
      expect(str1).not.toBe(str2);
    });

    it('should only contain alphanumeric characters', () => {
      const randomStr = generateRandomString(100);
      expect(randomStr).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should use default length when no parameter provided', () => {
      const defaultStr = generateRandomString();
      expect(defaultStr).toHaveLength(32);
    });
  });

  describe('calculateReadTime', () => {
    it('should calculate read time correctly', () => {
      const shortText = 'This is a short text with exactly ten words here.';
      const longText = 'word '.repeat(400); // 400 words
      
      expect(calculateReadTime(shortText)).toBe(1); // Less than 200 words = 1 minute
      expect(calculateReadTime(longText)).toBe(2); // 400 words / 200 wpm = 2 minutes
    });

    it('should handle empty or minimal content', () => {
      expect(calculateReadTime('')).toBe(1);
      expect(calculateReadTime('word')).toBe(1);
      expect(calculateReadTime('word word')).toBe(1);
    });

    it('should round up to nearest minute', () => {
      const text = 'word '.repeat(250); // 250 words should be 2 minutes (1.25 rounded up)
      expect(calculateReadTime(text)).toBe(2);
    });
  });

  describe('formatDate', () => {
    it('should format dates to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle date strings', () => {
      const dateString = '2024-01-15';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle current date', () => {
      const now = new Date();
      const formatted = formatDate(now);
      expect(formatted).toBe(now.toISOString());
    });
  });
});
