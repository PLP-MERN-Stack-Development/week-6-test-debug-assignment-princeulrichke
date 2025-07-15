// Unit tests for middleware functions

const request = require('supertest');
const express = require('express');
const { auth, optionalAuth, authorize } = require('../../src/middleware/auth');
const errorHandler = require('../../src/middleware/errorHandler');
const notFound = require('../../src/middleware/notFound');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

describe('Unit: Middleware Functions', () => {
  let app;
  let testUser;
  let token;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    });

    token = generateToken(testUser);
  });

  describe('Auth Middleware', () => {
    beforeEach(() => {
      app.get('/protected', auth, (req, res) => {
        res.json({ user: req.user.username });
      });
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBe('testuser');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not valid');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'invalid-format');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request for non-existent user', async () => {
      // Delete the user but keep the token
      await User.findByIdAndDelete(testUser._id);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('Optional Auth Middleware', () => {
    beforeEach(() => {
      app.get('/optional', optionalAuth, (req, res) => {
        res.json({ 
          authenticated: !!req.user,
          user: req.user?.username || null
        });
      });
    });

    it('should work with valid token', async () => {
      const response = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toBe('testuser');
    });

    it('should work without token', async () => {
      const response = await request(app)
        .get('/optional');

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.user).toBe(null);
    });

    it('should continue without auth for invalid token', async () => {
      const response = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.user).toBe(null);
    });
  });

  describe('Authorize Middleware', () => {
    let adminUser, adminToken;

    beforeEach(async () => {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      adminToken = generateToken(adminUser);

      app.get('/admin-only', auth, authorize('admin'), (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      app.get('/multi-role', auth, authorize('admin', 'moderator'), (req, res) => {
        res.json({ message: 'Multi-role access granted' });
      });
    });

    it('should allow access for correct role', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should deny access for incorrect role', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${token}`); // Regular user token

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access forbidden');
    });

    it('should work with multiple allowed roles', async () => {
      // Test with admin
      const adminResponse = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);

      // Create moderator for testing
      const moderator = await User.create({
        username: 'moderator',
        email: 'mod@example.com',
        password: 'password123',
        role: 'moderator',
      });

      const modToken = generateToken(moderator);

      const modResponse = await request(app)
        .get('/multi-role')
        .set('Authorization', `Bearer ${modToken}`);

      expect(modResponse.status).toBe(200);
    });

    it('should require authentication first', async () => {
      const response = await request(app)
        .get('/admin-only');

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handler Middleware', () => {
    beforeEach(() => {
      app.get('/cast-error', (req, res, next) => {
        const error = new Error('Cast to ObjectId failed');
        error.name = 'CastError';
        next(error);
      });

      app.get('/validation-error', (req, res, next) => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.errors = {
          email: { message: 'Email is required' },
          password: { message: 'Password is too short' },
        };
        next(error);
      });

      app.get('/jwt-error', (req, res, next) => {
        const error = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        next(error);
      });

      app.get('/custom-error', (req, res, next) => {
        const error = new Error('Custom error message');
        error.status = 400;
        next(error);
      });

      app.get('/generic-error', (req, res, next) => {
        next(new Error('Generic server error'));
      });

      app.use(errorHandler);
    });

    it('should handle CastError (404)', async () => {
      const response = await request(app).get('/cast-error');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Resource not found');
    });

    it('should handle ValidationError (400)', async () => {
      const response = await request(app).get('/validation-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email is required');
      expect(response.body.error).toContain('Password is too short');
    });

    it('should handle JWT errors (401)', async () => {
      const response = await request(app).get('/jwt-error');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should handle custom status errors', async () => {
      const response = await request(app).get('/custom-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Custom error message');
    });

    it('should handle generic errors (500)', async () => {
      const response = await request(app).get('/generic-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Generic server error');
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app).get('/generic-error');

      expect(response.body.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Not Found Middleware', () => {
    beforeEach(() => {
      app.get('/existing-route', (req, res) => {
        res.json({ message: 'Route exists' });
      });

      app.use(notFound);
      app.use(errorHandler);
    });

    it('should pass through existing routes', async () => {
      const response = await request(app).get('/existing-route');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Route exists');
    });

    it('should handle non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not Found - /non-existent-route');
    });

    it('should work with different HTTP methods', async () => {
      const response = await request(app).post('/non-existent-post');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('POST');
    });
  });
});
