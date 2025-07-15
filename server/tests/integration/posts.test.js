// Integration tests for posts API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const Category = require('../../src/models/Category');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let token;
let userId;
let postId;
let categoryId;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create a test category
  const category = await Category.create({
    name: 'Technology',
    description: 'Tech related posts',
  });
  categoryId = category._id;

  // Create a test user
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
  userId = user._id;
  token = generateToken(user);

  // Create a test post
  const post = await Post.create({
    title: 'Test Post',
    content: 'This is a test post content with more than ten words to meet the minimum requirement.',
    author: userId,
    category: categoryId,
    published: true,
    publishedAt: new Date(),
  });
  postId = post._id;
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up created posts between tests (keep user and category)
afterEach(async () => {
  await Post.deleteMany({ _id: { $ne: postId } });
});

describe('Integration: POST /api/posts', () => {
  it('should create a new post when authenticated', async () => {
    const newPost = {
      title: 'New Test Post for Integration Testing',
      content: 'This is a new test post content for integration testing with enough words to pass validation.',
      category: categoryId.toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(newPost);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post).toBeDefined();
    expect(res.body.data.post.title).toBe(newPost.title);
    expect(res.body.data.post.content).toBe(newPost.content);
    expect(res.body.data.post.author._id).toBe(userId.toString());
    expect(res.body.data.post.slug).toBeDefined();
    expect(res.body.data.post.readTime).toBeGreaterThan(0);
  });

  it('should return 401 if not authenticated', async () => {
    const newPost = {
      title: 'Unauthorized Post Title',
      content: 'This should not be created because user is not authenticated',
      category: categoryId.toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .send(newPost);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if validation fails', async () => {
    const invalidPost = {
      // Missing title
      content: 'This post is missing a title',
      category: categoryId.toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPost);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid category', async () => {
    const postWithInvalidCategory = {
      title: 'Post with Invalid Category',
      content: 'This post has an invalid category ID that does not exist in database',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(postWithInvalidCategory);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid category');
  });

  it('should create post with optional fields', async () => {
    const postWithOptionalFields = {
      title: 'Post with Optional Fields Test',
      content: 'This post includes optional fields like excerpt and tags for comprehensive testing',
      category: categoryId.toString(),
      excerpt: 'Custom excerpt for the post',
      tags: ['testing', 'integration', 'api'],
      published: true,
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(postWithOptionalFields);

    expect(res.status).toBe(201);
    expect(res.body.data.post.excerpt).toBe(postWithOptionalFields.excerpt);
    expect(res.body.data.post.tags).toEqual(postWithOptionalFields.tags);
    expect(res.body.data.post.published).toBe(true);
  });
});

describe('Integration: GET /api/posts', () => {
  beforeEach(async () => {
    // Create additional test posts
    await Post.create({
      title: 'Published Post One',
      content: 'Content for published post one with enough words for testing',
      author: userId,
      category: categoryId,
      published: true,
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      views: 100,
    });

    await Post.create({
      title: 'Published Post Two',
      content: 'Content for published post two with enough words for testing',
      author: userId,
      category: categoryId,
      published: true,
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      views: 50,
    });

    await Post.create({
      title: 'Draft Post',
      content: 'Content for draft post that should not appear in public listing',
      author: userId,
      category: categoryId,
      published: false,
    });
  });

  it('should return all published posts', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.posts)).toBeTruthy();
    expect(res.body.data.posts.length).toBeGreaterThan(0);
    
    // Should only return published posts
    res.body.data.posts.forEach(post => {
      expect(post.published).toBe(true);
    });
  });

  it('should include pagination information', async () => {
    const res = await request(app).get('/api/posts?limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.current).toBe(1);
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
    expect(res.body.data.pagination.pages).toBeGreaterThan(0);
    expect(res.body.data.posts.length).toBeLessThanOrEqual(2);
  });

  it('should filter posts by category', async () => {
    const res = await request(app)
      .get(`/api/posts?category=${categoryId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.posts)).toBeTruthy();
    
    res.body.data.posts.forEach(post => {
      expect(post.category._id || post.category).toBe(categoryId.toString());
    });
  });

  it('should sort posts correctly', async () => {
    // Test newest first (default)
    const newestRes = await request(app).get('/api/posts?sort=newest');
    expect(newestRes.status).toBe(200);
    
    // Test oldest first
    const oldestRes = await request(app).get('/api/posts?sort=oldest');
    expect(oldestRes.status).toBe(200);
    
    // Test by popularity (views)
    const popularRes = await request(app).get('/api/posts?sort=popular');
    expect(popularRes.status).toBe(200);
  });

  it('should handle invalid query parameters gracefully', async () => {
    const res = await request(app).get('/api/posts?page=invalid&limit=abc');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/posts/:id', () => {
  it('should return a post by ID', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(postId.toString());
    expect(res.body.title).toBe('Test Post');
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/posts/${nonExistentId}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/posts/:id', () => {
  it('should update a post when authenticated as author', async () => {
    const updates = {
      title: 'Updated Test Post',
      content: 'This content has been updated',
    };

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(updates.title);
    expect(res.body.content).toBe(updates.content);
  });

  it('should return 401 if not authenticated', async () => {
    const updates = {
      title: 'Unauthorized Update',
    };

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send(updates);

    expect(res.status).toBe(401);
  });

  it('should return 403 if not the author', async () => {
    // Create another user
    const anotherUser = await User.create({
      username: 'anotheruser',
      email: 'another@example.com',
      password: 'password123',
    });
    const anotherToken = generateToken(anotherUser);

    const updates = {
      title: 'Forbidden Update',
    };

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${anotherToken}`)
      .send(updates);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('should delete a post when authenticated as author', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    // Verify post is deleted
    const deletedPost = await Post.findById(postId);
    expect(deletedPost).toBeNull();
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`);

    expect(res.status).toBe(401);
  });
}); 