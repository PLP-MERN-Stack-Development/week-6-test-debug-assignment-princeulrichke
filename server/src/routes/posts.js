const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { auth, optionalAuth } = require('../middleware/auth');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Validation middleware
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10000 characters'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
];

// @route   GET /api/posts
// @desc    Get all posts with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isMongoId().withMessage('Category must be a valid ID'),
  query('author').optional().isMongoId().withMessage('Author must be a valid ID'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  query('tag').optional().trim().isLength({ min: 1 }).withMessage('Tag cannot be empty'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      search,
      tag,
      featured,
      sort = 'newest'
    } = req.query;

    // Build query
    const query = { published: true };
    
    if (category) query.category = category;
    if (author) query.author = author;
    if (tag) query.tags = { $in: [tag] };
    if (featured !== undefined) query.featured = featured === 'true';
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'oldest':
        sortOptions = { publishedAt: 1 };
        break;
      case 'popular':
        sortOptions = { views: -1, likesCount: -1 };
        break;
      case 'title':
        sortOptions = { title: 1 };
        break;
      default: // 'newest'
        sortOptions = { publishedAt: -1 };
    }

    // Execute query with pagination
    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('category', 'name slug color')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    logger.info(`Posts retrieved: ${posts.length} of ${total}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving posts',
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar bio')
      .populate('category', 'name slug color description')
      .populate('comments.user', 'username firstName lastName avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Only show published posts to non-authors
    if (!post.published && (!req.user || post.author._id.toString() !== req.user._id.toString())) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Increment view count (but not for the author)
    if (!req.user || post.author._id.toString() !== req.user._id.toString()) {
      await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }

    logger.info(`Post viewed: ${post.title} by ${req.user?.username || 'anonymous'}`);

    res.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }
    
    logger.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving post',
    });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, postValidation, handleValidationErrors, async (req, res) => {
  try {
    const { title, content, category, excerpt, tags, published = false, image } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
      });
    }

    // Create post
    const post = await Post.create({
      title,
      content,
      category,
      excerpt,
      tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
      author: req.user._id,
      published,
      image,
    });

    // Populate the created post
    await post.populate('author', 'username firstName lastName avatar');
    await post.populate('category', 'name slug color');

    logger.info(`Post created: ${post.title} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post },
    });
  } catch (error) {
    logger.error('Create post error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Post with this slug already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error creating post',
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (Author only)
router.put('/:id', auth, postValidation, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post',
      });
    }

    const { title, content, category, excerpt, tags, published, image } = req.body;

    // Verify category exists if changing
    if (category && category !== post.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category',
        });
      }
    }

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags) post.tags = tags.map(tag => tag.toLowerCase().trim());
    if (published !== undefined) post.published = published;
    if (image !== undefined) post.image = image;

    // Reset slug if title changed
    if (title && title !== post.title) {
      post.slug = undefined; // Will be regenerated by pre-save middleware
    }

    await post.save();

    // Populate the updated post
    await post.populate('author', 'username firstName lastName avatar');
    await post.populate('category', 'name slug color');

    logger.info(`Post updated: ${post.title} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    logger.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating post',
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (Author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    logger.info(`Post deleted: ${post.title} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    logger.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting post',
    });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if already liked
    const existingLike = post.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike the post
      post.likes = post.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
      await post.save();

      res.json({
        success: true,
        message: 'Post unliked',
        data: { liked: false, likesCount: post.likesCount },
      });
    } else {
      // Like the post
      post.likes.push({ user: req.user._id });
      await post.save();

      res.json({
        success: true,
        message: 'Post liked',
        data: { liked: true, likesCount: post.likesCount },
      });
    }

    logger.info(`Post ${existingLike ? 'unliked' : 'liked'}: ${post.title} by ${req.user.username}`);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    logger.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing like',
    });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
], handleValidationErrors, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    post.comments.push({
      user: req.user._id,
      content: content.trim(),
    });

    await post.save();
    
    // Populate the new comment
    await post.populate('comments.user', 'username firstName lastName avatar');

    const newComment = post.comments[post.comments.length - 1];

    logger.info(`Comment added to post: ${post.title} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: newComment },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding comment',
    });
  }
});

module.exports = router;
