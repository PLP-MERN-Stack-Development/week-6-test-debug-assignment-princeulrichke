describe('Dashboard and Posts Management', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
  });

  describe('Posts Display', () => {
    it('should display posts correctly', () => {
      cy.wait('@getPosts');
      
      cy.get('[data-testid="posts-container"]').should('be.visible');
      cy.get('[data-testid="post-item"]').should('have.length.at.least', 1);
      
      // Check first post
      cy.get('[data-testid="post-item"]').first().within(() => {
        cy.get('[data-testid="post-title"]').should('contain.text', 'Introduction to MERN Stack');
        cy.get('[data-testid="post-content"]').should('contain.text', 'The MERN stack is a popular');
        cy.get('[data-testid="post-author"]').should('contain.text', 'By: John Doe');
      });
    });

    it('should refresh posts when refresh button is clicked', () => {
      cy.wait('@getPosts');
      
      cy.get('[data-testid="refresh-posts-button"]').click();
      cy.get('[data-testid="refresh-posts-button"]').should('contain.text', 'Loading...');
      
      cy.wait('@getPosts');
      cy.get('[data-testid="refresh-posts-button"]').should('contain.text', 'Refresh Posts');
    });

    it('should handle empty posts state', () => {
      cy.mockApiResponse('GET', '/api/posts', []);
      
      cy.reload();
      cy.wait('@getPosts');
      
      cy.get('[data-testid="empty-posts-message"]').should('be.visible');
      cy.get('[data-testid="empty-posts-message"]').should('contain.text', 'No posts found');
    });

    it('should handle posts loading error', () => {
      cy.mockApiResponse('GET', '/api/posts', {
        error: 'Failed to fetch posts'
      }, 500);
      
      cy.reload();
      cy.wait('@getPosts');
      
      cy.shouldShowError('Failed to fetch posts');
    });

    it('should display posts with proper formatting', () => {
      cy.wait('@getPosts');
      
      cy.get('[data-testid="post-item"]').each(($post) => {
        cy.wrap($post).within(() => {
          cy.get('[data-testid="post-title"]').should('be.visible');
          cy.get('[data-testid="post-content"]').should('be.visible');
          cy.get('[data-testid="post-author"]').should('be.visible');
          cy.get('[data-testid="post-date"]').should('be.visible');
        });
      });
    });
  });

  describe('Post Creation', () => {
    beforeEach(() => {
      cy.login(); // Need to be authenticated to create posts
    });

    it('should open create post modal', () => {
      cy.get('[data-testid="new-post-button"]').click();
      cy.get('[data-testid="create-post-modal"]').should('be.visible');
      cy.get('[data-testid="post-title-input"]').should('be.visible');
      cy.get('[data-testid="post-content-input"]').should('be.visible');
    });

    it('should validate required fields for new post', () => {
      cy.get('[data-testid="new-post-button"]').click();
      cy.get('[data-testid="submit-post-button"]').click();
      
      cy.shouldShowError('Title is required');
      cy.shouldShowError('Content is required');
    });

    it('should create a new post successfully', () => {
      cy.mockApiResponse('POST', '/api/posts', {
        _id: 'new-post-id',
        title: 'New Test Post',
        content: 'This is a new test post content',
        author: { name: 'Test User' }
      });

      cy.createPost({
        title: 'New Test Post',
        content: 'This is a new test post content'
      });
      
      cy.shouldShowSuccess('Post created successfully');
      cy.get('[data-testid="create-post-modal"]').should('not.exist');
      
      // Should refresh posts list
      cy.wait('@getPosts');
    });

    it('should handle post creation error', () => {
      cy.mockApiResponse('POST', '/api/posts', {
        error: 'Failed to create post'
      }, 500);
      
      cy.get('[data-testid="new-post-button"]').click();
      cy.createPost();
      
      cy.shouldShowError('Failed to create post');
    });

    it('should cancel post creation', () => {
      cy.get('[data-testid="new-post-button"]').click();
      cy.get('[data-testid="post-title-input"]').type('Test Title');
      cy.get('[data-testid="cancel-post-button"]').click();
      
      cy.get('[data-testid="create-post-modal"]').should('not.exist');
      
      // Should not create post
      cy.get('[data-testid="new-post-button"]').click();
      cy.get('[data-testid="post-title-input"]').should('have.value', '');
    });
  });

  describe('Post Interactions', () => {
    beforeEach(() => {
      cy.wait('@getPosts');
    });

    it('should allow editing posts', () => {
      cy.get('[data-testid="post-item"]').first().within(() => {
        cy.get('[data-testid="edit-post-button"]').click();
      });
      
      cy.get('[data-testid="edit-post-modal"]').should('be.visible');
      cy.get('[data-testid="post-title-input"]').should('have.value', 'Introduction to MERN Stack');
    });

    it('should allow deleting posts', () => {
      cy.mockApiResponse('DELETE', '/api/posts/*', { success: true });
      
      cy.get('[data-testid="post-item"]').first().within(() => {
        cy.get('[data-testid="delete-post-button"]').click();
      });
      
      cy.get('[data-testid="confirm-delete-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      cy.shouldShowSuccess('Post deleted successfully');
      cy.wait('@getPosts'); // Should refresh the list
    });

    it('should show post details on click', () => {
      cy.get('[data-testid="post-item"]').first().click();
      
      cy.shouldBeOnPage('/posts/');
      cy.get('[data-testid="post-detail"]').should('be.visible');
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      cy.wait('@getPosts');
    });

    it('should search posts by title', () => {
      cy.get('[data-testid="search-input"]').type('MERN');
      
      cy.get('[data-testid="post-item"]').should('have.length', 1);
      cy.get('[data-testid="post-title"]').should('contain.text', 'MERN Stack');
    });

    it('should filter posts by category', () => {
      cy.get('[data-testid="category-filter"]').select('Technology');
      
      cy.get('[data-testid="post-item"]').each(($post) => {
        cy.wrap($post).within(() => {
          cy.get('[data-testid="post-category"]').should('contain.text', 'Technology');
        });
      });
    });

    it('should clear search and filters', () => {
      cy.get('[data-testid="search-input"]').type('MERN');
      cy.get('[data-testid="category-filter"]').select('Technology');
      
      cy.get('[data-testid="clear-filters-button"]').click();
      
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="category-filter"]').should('have.value', '');
      cy.get('[data-testid="post-item"]').should('have.length.at.least', 2);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', () => {
      // Mock paginated response
      cy.mockApiResponse('GET', '/api/posts?page=1', {
        posts: [], // First page posts
        totalPages: 3,
        currentPage: 1,
        totalPosts: 25
      });
      
      cy.reload();
      
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="page-2"]').click();
      
      cy.shouldBeOnPage('/dashboard?page=2');
    });

    it('should maintain search criteria across pages', () => {
      cy.get('[data-testid="search-input"]').type('React');
      cy.get('[data-testid="page-2"]').click();
      
      cy.get('[data-testid="search-input"]').should('have.value', 'React');
    });
  });
});
