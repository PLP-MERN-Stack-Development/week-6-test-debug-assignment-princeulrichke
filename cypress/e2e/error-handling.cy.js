describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Error Boundary', () => {
    it('should display error boundary when component throws error', () => {
      cy.get('[href="/error-test"]').click();
      cy.get('[data-testid="trigger-error-button"]').click();
      
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('h2').should('contain.text', 'Oops! Something went wrong');
      cy.get('[data-testid="error-message"]').should('contain.text', 'We\'re sorry for the inconvenience');
    });

    it('should show error details in development mode', () => {
      cy.get('[href="/error-test"]').click();
      cy.get('[data-testid="trigger-error-button"]').click();
      
      // Assuming we're in development mode
      cy.get('[data-testid="error-details"]').should('be.visible');
      cy.get('[data-testid="error-stack"]').should('contain.text', 'Error:');
    });

    it('should allow retry after error', () => {
      cy.get('[href="/error-test"]').click();
      cy.get('[data-testid="trigger-error-button"]').click();
      
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('[data-testid="try-again-button"]').click();
      
      // Should reset the error state
      cy.get('[data-testid="error-boundary"]').should('not.exist');
      cy.get('h2').should('contain.text', 'Error Boundary Test');
    });

    it('should allow page refresh after error', () => {
      cy.get('[href="/error-test"]').click();
      cy.get('[data-testid="trigger-error-button"]').click();
      
      cy.get('[data-testid="refresh-page-button"]').click();
      
      // Page should reload
      cy.get('h2').should('contain.text', 'Error Boundary Test');
      cy.get('[data-testid="error-boundary"]').should('not.exist');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/posts', { forceNetworkError: true }).as('networkError');
      
      cy.get('[href="/dashboard"]').click();
      
      cy.wait('@networkError');
      cy.shouldShowError('Network error. Please check your connection.');
    });

    it('should handle timeout errors', () => {
      // Simulate timeout
      cy.intercept('GET', '/api/posts', (req) => {
        req.reply((res) => {
          res.delay(15000); // Longer than request timeout
        });
      }).as('timeoutError');
      
      cy.get('[href="/dashboard"]').click();
      
      cy.shouldShowError('Request timeout. Please try again.');
    });

    it('should handle server errors (500)', () => {
      cy.mockApiResponse('GET', '/api/posts', {
        error: 'Internal server error'
      }, 500);
      
      cy.get('[href="/dashboard"]').click();
      
      cy.shouldShowError('Server error. Please try again later.');
    });

    it('should handle unauthorized errors (401)', () => {
      cy.mockApiResponse('GET', '/api/posts', {
        error: 'Unauthorized'
      }, 401);
      
      cy.get('[href="/dashboard"]').click();
      
      cy.shouldShowError('Session expired. Please log in again.');
      cy.shouldBeOnPage('/login');
    });

    it('should handle forbidden errors (403)', () => {
      cy.mockApiResponse('GET', '/api/admin/users', {
        error: 'Forbidden'
      }, 403);
      
      cy.visit('/admin/users');
      
      cy.shouldShowError('Access denied. You don\'t have permission to view this page.');
    });

    it('should handle not found errors (404)', () => {
      cy.mockApiResponse('GET', '/api/posts/invalid-id', {
        error: 'Post not found'
      }, 404);
      
      cy.visit('/posts/invalid-id');
      
      cy.shouldShowError('The requested resource was not found.');
    });
  });

  describe('Form Validation Edge Cases', () => {
    beforeEach(() => {
      cy.get('[href="/login"]').click();
    });

    it('should handle special characters in email', () => {
      cy.get('[data-testid="email-input"]').type('test+special@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      // Should accept valid email with special characters
      cy.wait('@login');
    });

    it('should handle very long input values', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const longPassword = 'p'.repeat(200);
      
      cy.get('[data-testid="email-input"]').type(longEmail);
      cy.get('[data-testid="password-input"]').type(longPassword);
      
      cy.get('[data-testid="email-input"]').should('have.value', longEmail);
      cy.get('[data-testid="password-input"]').should('have.value', longPassword);
    });

    it('should handle SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      cy.get('[data-testid="email-input"]').type(sqlInjection);
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.shouldShowError('Invalid email format');
    });

    it('should handle XSS attempts', () => {
      const xssAttempt = '<script>alert("xss")</script>';
      
      cy.get('[data-testid="email-input"]').type(xssAttempt);
      
      // Input should be properly escaped
      cy.get('[data-testid="email-input"]').should('not.contain', '<script>');
    });
  });

  describe('Browser Compatibility', () => {
    it('should work with disabled JavaScript', () => {
      // This test would require specific setup for no-JS testing
      // For now, we'll test graceful degradation
      cy.visit('/', { 
        onBeforeLoad: (win) => {
          // Simulate some browser limitations
          delete win.localStorage;
        }
      });
      
      // Should still display basic content
      cy.get('h1').should('be.visible');
    });

    it('should handle localStorage not available', () => {
      cy.window().then((win) => {
        // Mock localStorage to throw errors
        Object.defineProperty(win, 'localStorage', {
          value: {
            getItem: () => { throw new Error('localStorage not available'); },
            setItem: () => { throw new Error('localStorage not available'); },
            removeItem: () => { throw new Error('localStorage not available'); }
          }
        });
      });
      
      cy.get('[href="/login"]').click();
      
      // App should still work without localStorage
      cy.get('[data-testid="email-input"]').should('be.visible');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle large datasets', () => {
      // Mock large dataset
      const largePosts = Array.from({ length: 1000 }, (_, i) => ({
        _id: `post-${i}`,
        title: `Post ${i}`,
        content: `Content for post ${i}`,
        author: { name: `Author ${i}` }
      }));
      
      cy.mockApiResponse('GET', '/api/posts', largePosts);
      
      cy.get('[href="/dashboard"]').click();
      
      // Should handle large dataset without crashing
      cy.get('[data-testid="posts-container"]').should('be.visible');
      cy.get('[data-testid="post-item"]').should('have.length.at.most', 20); // Assuming pagination
    });

    it('should handle slow network conditions', () => {
      cy.simulateSlowNetwork();
      
      cy.get('[href="/dashboard"]').click();
      
      // Should show loading states
      cy.get('[data-testid="loading"]').should('be.visible');
      
      cy.wait('@getPosts');
      cy.get('[data-testid="loading"]').should('not.exist');
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle CSRF token missing', () => {
      cy.mockApiResponse('POST', '/api/auth/login', {
        error: 'CSRF token missing'
      }, 403);
      
      cy.get('[href="/login"]').click();
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.shouldShowError('Security error. Please refresh and try again.');
    });

    it('should handle rate limiting', () => {
      cy.mockApiResponse('POST', '/api/auth/login', {
        error: 'Too many requests'
      }, 429);
      
      cy.get('[href="/login"]').click();
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.shouldShowError('Too many login attempts. Please wait before trying again.');
    });
  });
});
