import { setupServer } from 'msw/node';
import { rest } from 'msw';

const BASE_URL = 'http://localhost:5000/api';

export const handlers = [
  // Auth handlers
  rest.post(`${BASE_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user',
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    );
  }),

  rest.post(`${BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user',
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    );
  }),

  rest.get(`${BASE_URL}/auth/me`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            role: 'user',
          },
        },
      })
    );
  }),

  // Posts handlers
  rest.get(`${BASE_URL}/posts`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          posts: [
            {
              _id: '1',
              title: 'Test Post 1',
              content: 'Content for test post 1',
              excerpt: 'Excerpt for test post 1',
              author: {
                _id: '1',
                username: 'testuser',
                firstName: 'John',
                lastName: 'Doe',
              },
              category: {
                _id: '1',
                name: 'Technology',
                slug: 'technology',
              },
              published: true,
              createdAt: '2024-01-01T00:00:00.000Z',
              views: 100,
              likesCount: 5,
            },
            {
              _id: '2',
              title: 'Test Post 2',
              content: 'Content for test post 2',
              excerpt: 'Excerpt for test post 2',
              author: {
                _id: '1',
                username: 'testuser',
                firstName: 'John',
                lastName: 'Doe',
              },
              category: {
                _id: '1',
                name: 'Technology',
                slug: 'technology',
              },
              published: true,
              createdAt: '2024-01-02T00:00:00.000Z',
              views: 75,
              likesCount: 3,
            },
          ],
          pagination: {
            current: 1,
            pages: 1,
            total: 2,
            hasNext: false,
            hasPrev: false,
          },
        },
      })
    );
  }),

  rest.get(`${BASE_URL}/posts/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          post: {
            _id: id,
            title: 'Test Post',
            content: 'Full content for test post with more details',
            excerpt: 'Excerpt for test post',
            author: {
              _id: '1',
              username: 'testuser',
              firstName: 'John',
              lastName: 'Doe',
              bio: 'Test user bio',
            },
            category: {
              _id: '1',
              name: 'Technology',
              slug: 'technology',
              description: 'Technology related posts',
            },
            published: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            views: 100,
            likesCount: 5,
            commentsCount: 2,
            comments: [
              {
                _id: 'c1',
                content: 'Great post!',
                user: {
                  _id: '2',
                  username: 'commenter',
                  firstName: 'Jane',
                  lastName: 'Smith',
                },
                createdAt: '2024-01-02T00:00:00.000Z',
              },
            ],
          },
        },
      })
    );
  }),

  rest.post(`${BASE_URL}/posts`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          post: {
            _id: '3',
            title: 'New Test Post',
            content: 'Content for new test post',
            author: {
              _id: '1',
              username: 'testuser',
            },
            category: {
              _id: '1',
              name: 'Technology',
            },
            published: false,
            createdAt: new Date().toISOString(),
          },
        },
      })
    );
  }),

  // Error handlers
  rest.get(`${BASE_URL}/error-test`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: 'Internal server error',
      })
    );
  }),
];

export const server = setupServer(...handlers);
