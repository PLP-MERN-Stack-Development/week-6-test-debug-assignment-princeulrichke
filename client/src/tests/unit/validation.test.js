// Unit tests for validation utilities

import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateUrl,
  createValidator,
  validationRules,
} from '../../utils/validation';

describe('Unit: Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'test123@test-domain.com',
        'user_name@example.com',
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
        'test..test@domain.com',
        'test@domain',
        '',
        null,
        undefined,
        'test @example.com', // space
        'test@exam ple.com', // space
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
        'a1b2c3',
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
        null, // null
        undefined, // undefined
        'PASS123', // valid but we could add more requirements
      ];

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });

  describe('validateUsername', () => {
    it('should return true for valid usernames', () => {
      const validUsernames = [
        'testuser',
        'user123',
        'test_user',
        'User_Name_123',
        'abc',
        'a'.repeat(30), // exactly 30 chars
      ];

      validUsernames.forEach(username => {
        expect(validateUsername(username)).toBe(true);
      });
    });

    it('should return false for invalid usernames', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(31), // too long
        'user@name', // invalid character
        'user-name', // invalid character
        'user name', // space
        '', // empty
        null, // null
        undefined, // undefined
        '123!', // special character
      ];

      invalidUsernames.forEach(username => {
        expect(validateUsername(username)).toBe(false);
      });
    });
  });

  describe('validateRequired', () => {
    it('should return true for non-empty values', () => {
      const validValues = [
        'test',
        '123',
        'a',
        123,
        true,
        false,
        0, // zero is a valid value
      ];

      validValues.forEach(value => {
        expect(validateRequired(value)).toBe(true);
      });
    });

    it('should return false for empty values', () => {
      const invalidValues = [
        '',
        ' ', // just space
        '   ', // multiple spaces
        null,
        undefined,
      ];

      invalidValues.forEach(value => {
        expect(validateRequired(value)).toBe(false);
      });
    });
  });

  describe('validateMinLength', () => {
    it('should return true when value meets minimum length', () => {
      expect(validateMinLength('hello', 5)).toBe(true);
      expect(validateMinLength('hello world', 5)).toBe(true);
      expect(validateMinLength('12345', 5)).toBe(true);
      expect(validateMinLength(12345, 5)).toBe(true);
    });

    it('should return false when value is too short', () => {
      expect(validateMinLength('hi', 5)).toBe(false);
      expect(validateMinLength('', 1)).toBe(false);
      expect(validateMinLength(null, 1)).toBe(false);
      expect(validateMinLength(undefined, 1)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('should return true when value is within maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true);
      expect(validateMaxLength('', 10)).toBe(true);
      expect(validateMaxLength('exactly10!', 10)).toBe(true);
      expect(validateMaxLength(null, 10)).toBe(true);
      expect(validateMaxLength(undefined, 10)).toBe(true);
    });

    it('should return false when value exceeds maximum length', () => {
      expect(validateMaxLength('this is too long', 10)).toBe(false);
      expect(validateMaxLength('12345678901', 10)).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should return true for valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://subdomain.example.com/path',
        'https://example.com/path?query=value',
        'ftp://files.example.com',
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com', // missing protocol
        'http://',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false);
      });
    });
  });

  describe('createValidator', () => {
    it('should create a validator function that validates data', () => {
      const rules = {
        email: [
          { validator: validateRequired, message: 'Email is required' },
          { validator: validateEmail, message: 'Invalid email' },
        ],
        password: [
          { validator: validateRequired, message: 'Password is required' },
          { validator: validatePassword, message: 'Invalid password' },
        ],
      };

      const validator = createValidator(rules);
      
      // Valid data
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const validResult = validator(validData);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual({});

      // Invalid data
      const invalidData = {
        email: 'invalid-email',
        password: '',
      };
      
      const invalidResult = validator(invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.email).toBe('Invalid email');
      expect(invalidResult.errors.password).toBe('Password is required');
    });

    it('should stop at first error for each field', () => {
      const rules = {
        test: [
          { validator: validateRequired, message: 'Required' },
          { validator: (value) => validateMinLength(value, 10), message: 'Too short' },
        ],
      };

      const validator = createValidator(rules);
      const result = validator({ test: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.test).toBe('Required'); // First error, not 'Too short'
    });
  });

  describe('validationRules', () => {
    it('should provide predefined email validation rules', () => {
      expect(validationRules.email).toBeDefined();
      expect(Array.isArray(validationRules.email)).toBe(true);
      expect(validationRules.email.length).toBeGreaterThan(0);
    });

    it('should provide predefined password validation rules', () => {
      expect(validationRules.password).toBeDefined();
      expect(Array.isArray(validationRules.password)).toBe(true);
      expect(validationRules.password.length).toBeGreaterThan(0);
    });

    it('should provide predefined username validation rules', () => {
      expect(validationRules.username).toBeDefined();
      expect(Array.isArray(validationRules.username)).toBe(true);
      expect(validationRules.username.length).toBeGreaterThan(0);
    });

    it('should work with createValidator', () => {
      const validator = createValidator({
        email: validationRules.email,
        password: validationRules.password,
      });

      const result = validator({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.isValid).toBe(true);
    });
  });
});
