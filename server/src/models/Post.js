const mongoose = require('mongoose');
const { slugify, calculateReadTime } = require('../utils/helpers');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters long'],
    maxlength: [10000, 'Content cannot exceed 10000 characters'],
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  featured: {
    type: Boolean,
    default: false,
  },
  published: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
  },
  readTime: {
    type: Number, // in minutes
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  }],
  image: {
    url: String,
    alt: String,
    caption: String,
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    keywords: [String],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals
postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

postSchema.virtual('isPublished').get(function() {
  return this.published && this.publishedAt && this.publishedAt <= new Date();
});

postSchema.virtual('url').get(function() {
  return `/posts/${this.slug}`;
});

// Indexes
postSchema.index({ slug: 1 });
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ published: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ featured: 1 });
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Pre-save middleware
postSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = slugify(this.title);
  }
  
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    const maxLength = 200;
    this.excerpt = this.content.length > maxLength 
      ? this.content.substring(0, maxLength).trim() + '...'
      : this.content;
  }
  
  // Calculate read time
  if (this.content) {
    this.readTime = calculateReadTime(this.content);
  }
  
  // Set published date when publishing
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate SEO meta title if not provided
  if (!this.seo?.metaTitle) {
    if (!this.seo) this.seo = {};
    this.seo.metaTitle = this.title.length > 60 
      ? this.title.substring(0, 57) + '...'
      : this.title;
  }
  
  // Generate SEO meta description if not provided
  if (!this.seo?.metaDescription && this.excerpt) {
    if (!this.seo) this.seo = {};
    this.seo.metaDescription = this.excerpt.length > 160 
      ? this.excerpt.substring(0, 157) + '...'
      : this.excerpt;
  }
  
  next();
});

// Instance methods
postSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    throw new Error('Post already liked by this user');
  }
  
  this.likes.push({ user: userId });
  return this.save();
};

postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content.trim(),
  });
  return this.save();
};

postSchema.methods.updateComment = function(commentId, content) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.content = content.trim();
  comment.edited = true;
  comment.editedAt = new Date();
  
  return this.save();
};

postSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
  return this.save();
};

// Static methods
postSchema.statics.findPublished = function() {
  return this.find({
    published: true,
    publishedAt: { $lte: new Date() }
  }).sort({ publishedAt: -1 });
};

postSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, published: true });
};

postSchema.statics.incrementViews = function(postId) {
  return this.findByIdAndUpdate(
    postId,
    { $inc: { views: 1 } },
    { new: true }
  );
};

module.exports = mongoose.model('Post', postSchema);
