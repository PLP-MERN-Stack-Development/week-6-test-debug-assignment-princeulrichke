// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command for authentication flows
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.wait('@login');
});

// Register command for user registration flows
Cypress.Commands.add('register', (userData = {}) => {
  const defaultUserData = {
    name: 'Test User',
    email: 'newuser@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };
  
  const user = { ...defaultUserData, ...userData };
  
  cy.visit('/register');
  cy.get('[data-testid="name-input"]').type(user.name);
  cy.get('[data-testid="email-input"]').type(user.email);
  cy.get('[data-testid="password-input"]').type(user.password);
  cy.get('[data-testid="confirm-password-input"]').type(user.confirmPassword);
  cy.get('[data-testid="register-button"]').click();
  cy.wait('@register');
});

// Create post command
Cypress.Commands.add('createPost', (postData = {}) => {
  const defaultPostData = {
    title: 'Test Post Title',
    content: 'This is test post content',
    category: 'General'
  };
  
  const post = { ...defaultPostData, ...postData };
  
  cy.get('[data-testid="new-post-button"]').click();
  cy.get('[data-testid="post-title-input"]').type(post.title);
  cy.get('[data-testid="post-content-input"]').type(post.content);
  cy.get('[data-testid="post-category-select"]').select(post.category);
  cy.get('[data-testid="submit-post-button"]').click();
});

// Check accessibility
Cypress.Commands.add('checkA11y', (selector = null) => {
  cy.injectAxe();
  cy.checkA11y(selector, {
    rules: {
      'color-contrast': { enabled: false } // Disable for demo purposes
    }
  });
});

// Custom command to wait for element to be visible
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// Custom command to check if element contains text
Cypress.Commands.add('shouldContainText', (selector, text) => {
  cy.get(selector).should('contain.text', text);
});

// Custom command to verify URL
Cypress.Commands.add('shouldBeOnPage', (path) => {
  cy.url().should('include', path);
});

// Custom command to handle loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Custom command to dismiss notifications/alerts
Cypress.Commands.add('dismissNotification', () => {
  cy.get('[data-testid="notification-close"]').click({ multiple: true });
});

// Custom command to take a screenshot with timestamp
Cypress.Commands.add('takeScreenshot', (name) => {
  const timestamp = new Date().getTime();
  cy.screenshot(`${name}-${timestamp}`);
});

// Custom command to simulate network delays
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      res.delay(2000);
      res.send();
    });
  });
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  });
});

// Custom command to verify error messages
Cypress.Commands.add('shouldShowError', (message) => {
  cy.get('[data-testid="error-message"]').should('be.visible').and('contain.text', message);
});

// Custom command to verify success messages
Cypress.Commands.add('shouldShowSuccess', (message) => {
  cy.get('[data-testid="success-message"]').should('be.visible').and('contain.text', message);
});
