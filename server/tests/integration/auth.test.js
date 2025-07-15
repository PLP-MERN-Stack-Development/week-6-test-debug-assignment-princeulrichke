// Integration tests for authentication API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up database between tests
afterEach(async () => {
  await User.deleteMany({});
});

describe('Integration: Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe(userData.username);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.firstName).toBe(userData.firstName);
      expect(res.body.data.user.lastName).toBe(userData.lastName);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      
      // Password should not be returned
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create second user with same email
      const duplicateData = {
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('email already exists');
    });

    it('should return 400 for duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'user1@example.com',
        password: 'password123',
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create second user with same username
      const duplicateData = {
        username: 'duplicateuser',
        email: 'user2@example.com',
        password: 'password456',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('username already exists');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        username: 'testuser',
        // Missing email and password
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        username: 'testuser',
        email: 'invalid-email-format',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak', // Too short and no numbers
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate username format', async () => {
      const invalidUsernameData = {
        username: 'user@name!', // Invalid characters
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUsernameData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should login with correct credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(loginData.email);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      
      // Password should not be returned
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for incorrect email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'login@example.com',
        // Missing password
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(incompleteData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // Next attempt should be locked
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Account temporarily locked');
    });

    it('should reset login attempts on successful login', async () => {
      // Make a few failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'wrongpassword',
          });
      }

      // Successful login should reset attempts
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);

      // Check that user's login attempts were reset
      const user = await User.findById(testUser._id);
      expect(user.loginAttempts).toBe(0);
      expect(user.lastLogin).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let token;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'meuser',
        email: 'me@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Test bio',
      });
      token = generateToken(testUser);
    });

    it('should return current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.firstName).toBe(testUser.firstName);
      expect(res.body.data.user.lastName).toBe(testUser.lastName);
      expect(res.body.data.user.fullName).toBe('John Doe');
      expect(res.body.data.user.bio).toBe(testUser.bio);
      
      // Password should not be returned
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser;
    let token;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123',
      });
      token = generateToken(testUser);
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio information',
        avatar: 'https://example.com/avatar.jpg',
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firstName).toBe(updateData.firstName);
      expect(res.body.data.user.lastName).toBe(updateData.lastName);
      expect(res.body.data.user.bio).toBe(updateData.bio);
      expect(res.body.data.user.avatar).toBe(updateData.avatar);
      expect(res.body.data.user.fullName).toBe('Updated Name');
    });

    it('should validate field lengths', async () => {
      const invalidData = {
        firstName: 'A'.repeat(51), // Too long
        bio: 'B'.repeat(501), // Too long
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const updateData = {
        firstName: 'Updated',
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let testUser;
    let token;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'passworduser',
        email: 'password@example.com',
        password: 'oldpassword123',
      });
      token = generateToken(testUser);
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword456',
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');

      // Verify new password works for login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'newpassword456',
        });

      expect(loginRes.status).toBe(200);
    });

    it('should return 400 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword456',
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'weak', // Too weak
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword456',
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser;
    let token;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'logoutuser',
        email: 'logout@example.com',
        password: 'password123',
      });
      token = generateToken(testUser);
    });

    it('should logout successfully when authenticated', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logout successful');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
