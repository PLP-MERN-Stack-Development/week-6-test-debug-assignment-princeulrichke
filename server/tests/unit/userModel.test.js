// Unit tests for User model

const User = require('../../src/models/User');
const mongoose = require('mongoose');

describe('Unit: User Model', () => {
  describe('User Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).resolves.toBeDefined();
      
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should fail validation without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with short username', async () => {
      const userData = {
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with invalid username characters', async () => {
      const userData = {
        username: 'user@name', // Invalid characters
        email: 'test@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with short password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123', // Too short
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Schema Defaults', () => {
    it('should set default values correctly', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
      expect(user.loginAttempts).toBe(0);
      expect(user.avatar).toBe('');
      expect(user.bio).toBe('');
    });

    it('should allow overriding default values', async () => {
      const userData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        isActive: false,
        emailVerified: true,
      };

      const user = await User.create(userData);
      
      expect(user.role).toBe('admin');
      expect(user.isActive).toBe(false);
      expect(user.emailVerified).toBe(true);
    });
  });

  describe('User Virtual Properties', () => {
    it('should compute fullName virtual correctly', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await User.create(userData);
      expect(user.fullName).toBe('John Doe');
    });

    it('should handle missing first or last name in fullName', async () => {
      const user1 = await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
        firstName: 'John',
      });

      const user2 = await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
        lastName: 'Doe',
      });

      const user3 = await User.create({
        username: 'user3',
        email: 'user3@example.com',
        password: 'password123',
      });

      expect(user1.fullName).toBe('John');
      expect(user2.fullName).toBe('Doe');
      expect(user3.fullName).toBe('');
    });

    it('should check isLocked virtual correctly', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.isLocked).toBe(false);

      // Set lock time to future
      user.lockUntil = new Date(Date.now() + 3600000); // 1 hour from now
      expect(user.isLocked).toBe(true);

      // Set lock time to past
      user.lockUntil = new Date(Date.now() - 3600000); // 1 hour ago
      expect(user.isLocked).toBe(false);
    });
  });

  describe('User Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    describe('matchPassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.matchPassword('password123');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await user.matchPassword('wrongpassword');
        expect(isMatch).toBe(false);
      });
    });

    describe('incLoginAttempts', () => {
      it('should increment login attempts', async () => {
        expect(user.loginAttempts).toBe(0);
        
        await user.incLoginAttempts();
        const updatedUser = await User.findById(user._id);
        
        expect(updatedUser.loginAttempts).toBe(1);
      });

      it('should lock account after max attempts', async () => {
        // Set login attempts to near max
        user.loginAttempts = 4;
        await user.save();
        
        await user.incLoginAttempts();
        const updatedUser = await User.findById(user._id);
        
        expect(updatedUser.loginAttempts).toBe(5);
        expect(updatedUser.lockUntil).toBeDefined();
        expect(updatedUser.isLocked).toBe(true);
      });
    });
  });

  describe('User Static Methods', () => {
    describe('findByCredentials', () => {
      let user;

      beforeEach(async () => {
        user = await User.create({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      });

      it('should find user with correct credentials', async () => {
        const foundUser = await User.findByCredentials('test@example.com', 'password123');
        expect(foundUser._id).toEqual(user._id);
        expect(foundUser.email).toBe('test@example.com');
      });

      it('should throw error for non-existent email', async () => {
        await expect(
          User.findByCredentials('nonexistent@example.com', 'password123')
        ).rejects.toThrow('Invalid credentials');
      });

      it('should throw error for incorrect password', async () => {
        await expect(
          User.findByCredentials('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid credentials');
      });

      it('should handle locked account', async () => {
        // Lock the account
        user.lockUntil = new Date(Date.now() + 3600000);
        await user.save();

        await expect(
          User.findByCredentials('test@example.com', 'password123')
        ).rejects.toThrow('Account temporarily locked');
      });

      it('should reset login attempts on successful login', async () => {
        // Set some login attempts
        user.loginAttempts = 3;
        await user.save();

        const foundUser = await User.findByCredentials('test@example.com', 'password123');
        
        // Check that attempts were reset
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.loginAttempts).toBe(0);
        expect(updatedUser.lastLogin).toBeDefined();
      });
    });
  });

  describe('User Indexes', () => {
    it('should enforce unique email constraint', async () => {
      await User.create({
        username: 'user1',
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(
        User.create({
          username: 'user2',
          email: 'test@example.com', // Duplicate email
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    it('should enforce unique username constraint', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
      });

      await expect(
        User.create({
          username: 'testuser', // Duplicate username
          email: 'test2@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword',
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(50);
    });

    it('should not re-hash password if not modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const originalPassword = user.password;
      user.firstName = 'John';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    it('should hash new password when changed', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const originalPassword = user.password;
      user.password = 'newpassword';
      await user.save();

      expect(user.password).not.toBe(originalPassword);
      expect(user.password).not.toBe('newpassword');
    });
  });
});
