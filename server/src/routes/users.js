const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
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

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', auth, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  query('active').optional().isBoolean().withMessage('Active must be a boolean'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      active,
      sort = 'newest'
    } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (active !== undefined) query.isActive = active === 'true';
    
    // Search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'username':
        sortOptions = { username: 1 };
        break;
      case 'email':
        sortOptions = { email: 1 };
        break;
      default: // 'newest'
        sortOptions = { createdAt: -1 };
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -passwordResetToken -emailVerificationToken')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    logger.info(`Users retrieved: ${users.length} of ${total} by admin ${req.user.username}`);

    res.json({
      success: true,
      data: {
        users,
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
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving users',
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Own profile or admin)
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is accessing their own profile or is admin
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving user',
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only or own profile)
// @access  Private
router.put('/:id', auth, [
  body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check permissions
    const isOwnProfile = req.params.id === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const { firstName, lastName, bio, avatar, role, isActive } = req.body;

    // Update allowed fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    // Only admins can change role and active status
    if (isAdmin) {
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
    } else if (role !== undefined || isActive !== undefined) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to modify role or active status',
      });
    }

    await user.save();

    logger.info(`User updated: ${user.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating user',
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    logger.info(`User deleted: ${user.username} by admin ${req.user.username}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting user',
    });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private (Own profile or admin)
router.get('/:id/stats', auth, async (req, res) => {
  try {
    // Check permissions
    const isOwnProfile = req.params.id === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user statistics
    const Post = require('../models/Post');
    
    const stats = await Promise.all([
      Post.countDocuments({ author: req.params.id }),
      Post.countDocuments({ author: req.params.id, published: true }),
      Post.aggregate([
        { $match: { author: user._id } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Post.aggregate([
        { $match: { author: user._id } },
        { $unwind: '$likes' },
        { $group: { _id: null, totalLikes: { $sum: 1 } } }
      ]),
    ]);

    const [totalPosts, publishedPosts, viewsResult, likesResult] = stats;

    res.json({
      success: true,
      data: {
        stats: {
          totalPosts,
          publishedPosts,
          draftPosts: totalPosts - publishedPosts,
          totalViews: viewsResult[0]?.totalViews || 0,
          totalLikes: likesResult[0]?.totalLikes || 0,
          joinDate: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving user statistics',
    });
  }
});

module.exports = router;
