describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Process', () => {
    beforeEach(() => {
      cy.get('[href="/login"]').click();
    });

    it('should display login form correctly', () => {
      cy.get('h2').should('contain.text', 'Login');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="login-button"]').click();
      
      cy.shouldShowError('Email is required');
      cy.shouldShowError('Password is required');
    });

    it('should validate email format', () => {
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="password-input"]').click(); // Trigger blur event
      
      cy.shouldShowError('Please enter a valid email address');
    });

    it('should validate password length', () => {
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.shouldShowError('Password must be at least 6 characters long');
    });

    it('should handle successful login', () => {
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@login');
      cy.shouldShowSuccess('Login successful');
      
      // Should redirect to dashboard or update UI to show logged in state
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle login failure', () => {
      // Mock login failure
      cy.mockApiResponse('POST', '/api/auth/login', {
        error: 'Invalid credentials'
      }, 401);
      
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.shouldShowError('Invalid credentials');
    });

    it('should show loading state during login', () => {
      cy.simulateSlowNetwork();
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="login-button"]').should('contain.text', 'Logging in...');
      cy.get('[data-testid="login-button"]').should('be.disabled');
    });

    it('should remember email on page refresh', () => {
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="remember-me"]').check();
      
      cy.reload();
      
      cy.get('[data-testid="email-input"]').should('have.value', 'test@example.com');
    });
  });

  describe('Registration Process', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should display registration form correctly', () => {
      cy.get('h2').should('contain.text', 'Register');
      cy.get('[data-testid="name-input"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="confirm-password-input"]').should('be.visible');
      cy.get('[data-testid="register-button"]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="register-button"]').click();
      
      cy.shouldShowError('Name is required');
      cy.shouldShowError('Email is required');
      cy.shouldShowError('Password is required');
      cy.shouldShowError('Please confirm your password');
    });

    it('should validate password confirmation', () => {
      cy.get('[data-testid="name-input"]').type('Test User');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="confirm-password-input"]').type('different-password');
      cy.get('[data-testid="register-button"]').click();
      
      cy.shouldShowError('Passwords do not match');
    });

    it('should handle successful registration', () => {
      cy.register();
      
      cy.wait('@register');
      cy.shouldShowSuccess('Registration successful');
      
      // Should redirect to dashboard or show logged in state
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle registration failure for existing email', () => {
      cy.mockApiResponse('POST', '/api/auth/register', {
        error: 'Email already exists'
      }, 400);
      
      cy.register({ email: 'existing@example.com' });
      
      cy.shouldShowError('Email already exists');
    });
  });

  describe('Logout Process', () => {
    beforeEach(() => {
      // Login first
      cy.login();
    });

    it('should logout successfully', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Should clear user state and redirect
      cy.get('[data-testid="user-menu"]').should('not.exist');
      cy.get('[href="/login"]').should('be.visible');
    });

    it('should clear authentication data on logout', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Check that token is removed from localStorage
      cy.window().then((window) => {
        expect(window.localStorage.getItem('token')).to.be.null;
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without authentication', () => {
      cy.visit('/profile');
      
      cy.shouldBeOnPage('/login');
      cy.shouldShowError('Please log in to access this page');
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.login();
      cy.visit('/profile');
      
      cy.shouldBeOnPage('/profile');
      cy.get('h2').should('contain.text', 'Profile');
    });
  });
});
