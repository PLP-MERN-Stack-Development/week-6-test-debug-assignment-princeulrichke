// Client-side validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (!password) return false;
  if (password.length < 6) return false;
  if (!/(?=.*[a-zA-Z])/.test(password)) return false; // At least one letter
  if (!/(?=.*\d)/.test(password)) return false; // At least one number
  return true;
};

export const validateUsername = (username) => {
  if (!username) return false;
  if (username.length < 3 || username.length > 30) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
  return true;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return value ? value.toString().length <= maxLength : true;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Form validation helper
export const createValidator = (rules) => {
  return (data) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = data[field];
      
      for (const rule of fieldRules) {
        const isValid = rule.validator(value);
        if (!isValid) {
          errors[field] = rule.message;
          break; // Stop at first error for this field
        }
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
};

// Common validation rule sets
export const validationRules = {
  email: [
    { validator: validateRequired, message: 'Email is required' },
    { validator: validateEmail, message: 'Please enter a valid email address' },
  ],
  password: [
    { validator: validateRequired, message: 'Password is required' },
    { validator: validatePassword, message: 'Password must be at least 6 characters with letters and numbers' },
  ],
  username: [
    { validator: validateRequired, message: 'Username is required' },
    { validator: validateUsername, message: 'Username must be 3-30 characters, letters/numbers/underscore only' },
  ],
  firstName: [
    { validator: (value) => validateMaxLength(value, 50), message: 'First name cannot exceed 50 characters' },
  ],
  lastName: [
    { validator: (value) => validateMaxLength(value, 50), message: 'Last name cannot exceed 50 characters' },
  ],
  title: [
    { validator: validateRequired, message: 'Title is required' },
    { validator: (value) => validateMinLength(value, 5), message: 'Title must be at least 5 characters' },
    { validator: (value) => validateMaxLength(value, 200), message: 'Title cannot exceed 200 characters' },
  ],
  content: [
    { validator: validateRequired, message: 'Content is required' },
    { validator: (value) => validateMinLength(value, 10), message: 'Content must be at least 10 characters' },
    { validator: (value) => validateMaxLength(value, 10000), message: 'Content cannot exceed 10000 characters' },
  ],
  bio: [
    { validator: (value) => validateMaxLength(value, 500), message: 'Bio cannot exceed 500 characters' },
  ],
};
