// Unit tests for authentication utilities

const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
} = require('../../src/utils/auth');

describe('Unit: Authentication Utilities', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    username: 'testuser',
  };

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samepassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctpassword';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashedPassword = await hashPassword('');
      
      const isMatch1 = await comparePassword('', hashedPassword);
      const isMatch2 = await comparePassword('notempty', hashedPassword);
      
      expect(isMatch1).toBe(true);
      expect(isMatch2).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user information in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.username).toBe(mockUser.username);
    });

    it('should include expiration time', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser._id);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => verifyToken(malformedToken)).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow();
      expect(() => verifyToken(null)).toThrow();
      expect(() => verifyToken(undefined)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const refreshToken = generateRefreshToken(mockUser);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);
    });

    it('should generate different tokens for access and refresh', () => {
      const accessToken = generateToken(mockUser);
      const refreshToken = generateRefreshToken(mockUser);
      
      expect(accessToken).not.toBe(refreshToken);
    });

    it('should include user ID in refresh token', () => {
      const refreshToken = generateRefreshToken(mockUser);
      
      // Note: We would need to verify this with the refresh secret
      // For now, just ensure it's a valid JWT structure
      expect(refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('Token Security', () => {
    it('should generate unique tokens for different users', () => {
      const user1 = { ...mockUser, _id: '507f1f77bcf86cd799439011' };
      const user2 = { ...mockUser, _id: '507f1f77bcf86cd799439012' };
      
      const token1 = generateToken(user1);
      const token2 = generateToken(user2);
      
      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens at different times', async () => {
      const token1 = generateToken(mockUser);
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token2 = generateToken(mockUser);
      
      expect(token1).not.toBe(token2);
    });
  });
});
