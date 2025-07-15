describe('Application Navigation and Routing', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the home page correctly', () => {
    cy.get('h1').should('contain.text', 'Welcome to MERN Testing App');
    cy.get('nav').should('be.visible');
    cy.get('[href="/"]').should('contain.text', 'Home');
    cy.get('[href="/login"]').should('contain.text', 'Login');
    cy.get('[href="/dashboard"]').should('contain.text', 'Dashboard');
    cy.get('[href="/error-test"]').should('contain.text', 'Error Test');
  });

  it('should navigate between pages correctly', () => {
    // Test navigation to login page
    cy.get('[href="/login"]').click();
    cy.shouldBeOnPage('/login');
    cy.get('h2').should('contain.text', 'Login');

    // Test navigation to dashboard page
    cy.get('[href="/dashboard"]').click();
    cy.shouldBeOnPage('/dashboard');
    cy.get('h2').should('contain.text', 'Dashboard');

    // Test navigation to error test page
    cy.get('[href="/error-test"]').click();
    cy.shouldBeOnPage('/error-test');
    cy.get('h2').should('contain.text', 'Error Boundary Test');

    // Test navigation back to home
    cy.get('[href="/"]').click();
    cy.shouldBeOnPage('/');
    cy.get('h1').should('contain.text', 'Welcome to MERN Testing App');
  });

  it('should have responsive navigation on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('nav').should('be.visible');
    
    // Navigation should still be functional on mobile
    cy.get('[href="/login"]').should('be.visible').click();
    cy.shouldBeOnPage('/login');
  });

  it('should maintain navigation state across page refreshes', () => {
    cy.get('[href="/dashboard"]').click();
    cy.shouldBeOnPage('/dashboard');
    
    cy.reload();
    cy.shouldBeOnPage('/dashboard');
    cy.get('h2').should('contain.text', 'Dashboard');
  });

  it('should handle direct URL access', () => {
    cy.visit('/dashboard');
    cy.get('h2').should('contain.text', 'Dashboard');
    
    cy.visit('/login');
    cy.get('h2').should('contain.text', 'Login');
    
    cy.visit('/error-test');
    cy.get('h2').should('contain.text', 'Error Boundary Test');
  });

  it('should have proper meta tags and title', () => {
    cy.title().should('include', 'MERN App');
    cy.get('meta[name="viewport"]').should('have.attr', 'content', 'width=device-width, initial-scale=1');
  });
});
