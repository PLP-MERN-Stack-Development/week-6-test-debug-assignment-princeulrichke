[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19939947&assignment_repo_type=AssignmentRepo)

# 🧪 MERN Stack Testing & Debugging Assignment

[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg)](https://github.com/)
[![Coverage](https://img.shields.io/badge/Coverage-%E2%89%A570%25-brightgreen.svg)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 📋 Project Overview

This project demonstrates comprehensive testing and debugging strategies for a MERN (MongoDB, Express.js, React, Node.js) stack application. It includes unit testing, integration testing, end-to-end testing, error handling, and performance monitoring.

## 🏗️ Architecture

```
project-root/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── tests/          # Client-side tests
│   │   └── App.jsx         # Main application component
│   ├── cypress/            # End-to-end tests
│   └── package.json        # Client dependencies
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Server utilities
│   │   └── app.js          # Express application
│   ├── tests/              # Server-side tests
│   └── package.json        # Server dependencies
└── cypress/                # E2E test configuration
```

## 🧪 Testing Strategy

### 1. Unit Testing

**Tools**: Jest, React Testing Library, Supertest

**Coverage Areas**:
- React component rendering and interactions
- Utility functions and business logic
- Express middleware functions
- Mongoose model validations
- Custom React hooks

**Key Features**:
- Isolated component testing with mocks
- Snapshot testing for UI consistency
- Test coverage reporting (≥70% target)
- Async function testing

### 2. Integration Testing

**Tools**: Supertest, MongoDB Memory Server, MSW (Mock Service Worker)

**Coverage Areas**:
- API endpoint testing
- Database operations
- Authentication flows
- React components with API interactions
- Form submissions and validation

**Key Features**:
- In-memory test database
- API mocking for client-side tests
- End-to-end data flow testing
- Error handling verification

### 3. End-to-End Testing

**Tools**: Cypress

**Coverage Areas**:
- User authentication flows
- CRUD operations
- Navigation and routing
- Error boundary testing
- Performance monitoring
- Visual regression testing

**Key Features**:
- Real browser testing
- Custom commands for common actions
- Network request interception
- Screenshot and video recording
- Accessibility testing

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (for production) or MongoDB Memory Server (for testing)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd week-6-test-debug-assignment
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Environment Setup

1. **Create environment files**
   ```bash
   # Server environment
   cp server/.env.example server/.env
   
   # Client environment (if needed)
   cp client/.env.example client/.env
   ```

2. **Configure environment variables**
   ```env
   # server/.env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mern-testing
   JWT_SECRET=your-jwt-secret-key
   LOG_LEVEL=info
   ```

## 🧪 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run client unit tests
npm run test:client

# Run server unit tests  
npm run test:server

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run client integration tests
cd client && npm run test:integration

# Run server integration tests
cd server && npm run test:integration
```

### End-to-End Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Open Cypress test runner
npm run test:e2e:open

# Run E2E tests with recording
npm run test:e2e:record
```

### All Tests

```bash
# Run complete test suite
npm run test:all

# Run tests with coverage report
npm run test:coverage
```

## 🚀 Running the Application

### Development Mode

```bash
# Start both client and server concurrently
npm run dev

# Or start them separately:

# Terminal 1 - Start server
cd server && npm run dev

# Terminal 2 - Start client  
cd client && npm run dev
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Testing Components

### Client-Side Components

#### Button Component
```jsx
// Located: client/src/components/Button.jsx
// Tests: client/src/tests/unit/Button.test.jsx

Features tested:
- Rendering with different variants
- Click event handling
- Disabled state behavior
- Accessibility attributes
```

#### LoginForm Component
```jsx
// Located: client/src/components/LoginForm.jsx  
// Tests: client/src/tests/unit/LoginForm.test.jsx

Features tested:
- Form validation
- User input handling
- Error message display
- Loading states
- Form submission
```

#### ErrorBoundary Component
```jsx
// Located: client/src/components/ErrorBoundary.jsx
// Tests: client/src/tests/unit/ErrorBoundary.test.jsx

Features tested:
- Error catching and display
- Retry functionality
- Development vs production modes
- Error logging
```

### Server-Side Components

#### Authentication Routes
```javascript
// Located: server/src/routes/auth.js
// Tests: server/tests/integration/auth.test.js

Features tested:
- User registration
- User login/logout
- JWT token validation
- Password hashing
- Input validation
```

#### Posts API
```javascript
// Located: server/src/routes/posts.js
// Tests: server/tests/integration/posts.test.js

Features tested:
- CRUD operations
- Authorization checks
- Data validation
- Error handling
- Pagination
```

### Custom Hooks

#### useApi Hook
```javascript
// Located: client/src/hooks/index.js
// Tests: client/src/tests/unit/hooks.test.js

Features tested:
- Data fetching
- Loading states
- Error handling
- Manual execution
```

#### useAuth Hook
```javascript
Features tested:
- Login/logout functionality
- Token management
- User state management
- Authentication persistence
```

## 🔧 Debugging Techniques

### Client-Side Debugging

1. **Error Boundaries**
   - Catches JavaScript errors in component tree
   - Displays fallback UI
   - Logs errors for monitoring

2. **Browser Developer Tools**
   - React Developer Tools extension
   - Network tab for API monitoring
   - Console for runtime errors
   - Performance profiling

3. **Logging Strategy**
   ```javascript
   // Development logging
   console.log('Debug info:', data);
   
   // Production error tracking
   errorTrackingService.logError(error);
   ```

### Server-Side Debugging

1. **Structured Logging**
   ```javascript
   // Located: server/src/utils/logger.js
   logger.info('User authenticated', { userId: user.id });
   logger.error('Database error', { error: err.message });
   ```

2. **Error Handling Middleware**
   ```javascript
   // Located: server/src/middleware/errorHandler.js
   - Global error catching
   - Structured error responses
   - Error logging and monitoring
   ```

3. **Performance Monitoring**
   ```javascript
   // Request timing middleware
   // Memory usage tracking  
   // Database query monitoring
   ```

### Testing Debugging

1. **Test Debugging**
   ```bash
   # Debug specific test
   npm run test -- --verbose ComponentName
   
   # Debug with Node debugger
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

2. **Cypress Debugging**
   ```javascript
   // Use cy.debug() in tests
   cy.get('button').debug().click();
   
   // Pause test execution
   cy.pause();
   
   // Screenshot on failure
   cy.screenshot('failure-state');
   ```

## 📊 Code Coverage

### Coverage Targets

- **Overall**: ≥70%
- **Components**: ≥80%
- **Utilities**: ≥90%
- **API Routes**: ≥75%

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## 🔒 Security Testing

### Client-Side Security

1. **XSS Prevention**
   - Input sanitization
   - Content Security Policy
   - Safe innerHTML usage

2. **Authentication Security**
   - Secure token storage
   - Token expiration handling
   - Protected route guards

### Server-Side Security

1. **Input Validation**
   ```javascript
   // Joi validation schemas
   // SQL injection prevention
   // NoSQL injection prevention
   ```

2. **Authentication & Authorization**
   ```javascript
   // JWT implementation
   // Password hashing (bcrypt)
   // Rate limiting
   // CORS configuration
   ```

## 🚀 Performance Testing

### Client Performance

1. **Bundle Analysis**
   ```bash
   npm run build:analyze
   ```

2. **Performance Monitoring**
   ```javascript
   // Core Web Vitals tracking
   // Component rendering performance
   // Memory leak detection
   ```

### Server Performance

1. **Load Testing**
   ```bash
   # Using autocannon
   npx autocannon http://localhost:5000/api/posts
   ```

2. **Database Performance**
   ```javascript
   // Query optimization
   // Index monitoring
   // Connection pooling
   ```

## 📝 Best Practices

### Testing Best Practices

1. **Test Structure**
   - Arrange, Act, Assert pattern
   - Descriptive test names
   - Isolated test cases
   - Proper cleanup

2. **Test Data Management**
   - Use factories for test data
   - Clean database between tests
   - Mock external dependencies

3. **Async Testing**
   ```javascript
   // Proper async/await usage
   // waitFor() for React Testing Library
   // cy.wait() for Cypress
   ```

### Debugging Best Practices

1. **Logging Standards**
   - Structured logging format
   - Appropriate log levels
   - Sensitive data protection

2. **Error Handling**
   - Graceful error recovery
   - User-friendly error messages
   - Comprehensive error tracking

## 🔍 Troubleshooting

### Common Issues

1. **Test Database Connection**
   ```bash
   # Ensure MongoDB Memory Server is running
   # Check network connectivity
   # Verify test database configuration
   ```

2. **Cypress Test Failures**
   ```bash
   # Clear Cypress cache
   npx cypress cache clear
   
   # Reset Cypress configuration
   npx cypress verify
   ```

3. **Coverage Issues**
   ```bash
   # Clear Jest cache
   npx jest --clearCache
   
   # Verify test file patterns
   # Check coverage thresholds
   ```

## 📁 File Structure Details

### Key Directories

```
├── client/src/
│   ├── components/         # React components with tests
│   ├── hooks/             # Custom hooks with tests  
│   ├── utils/             # Utility functions with tests
│   ├── tests/
│   │   ├── unit/          # Unit tests
│   │   ├── integration/   # Integration tests
│   │   ├── __mocks__/     # Mock files
│   │   └── setup.js       # Test configuration
│   └── ...

├── server/src/
│   ├── models/            # Mongoose models with tests
│   ├── routes/            # API routes with tests
│   ├── middleware/        # Express middleware with tests
│   ├── utils/             # Server utilities with tests
│   └── ...

├── server/tests/
│   ├── unit/              # Server unit tests
│   ├── integration/       # API integration tests
│   └── setup.js           # Test database setup

├── cypress/
│   ├── e2e/               # End-to-end test specs
│   ├── fixtures/          # Test data files
│   ├── support/           # Custom commands and utilities
│   └── ...
```

## 📸 Screenshots

### Test Coverage Report
![Coverage Report](./docs/images/coverage-report.png)

### Cypress Test Runner
![Cypress Tests](./docs/images/cypress-tests.png)

### Error Boundary Demo
![Error Boundary](./docs/images/error-boundary.png)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Express.js Testing](https://expressjs.com/en/guide/testing.html)
- [MongoDB Testing Best Practices](https://docs.mongodb.com/manual/testing/)

---

**Note**: This project is part of Week 6 assignment for MERN Stack Development course focusing on comprehensive testing and debugging strategies.
- Starter code for a MERN application with basic test setup:
  - Sample React components with test files
  - Express routes with test files
  - Jest and testing library configurations
  - Example tests for reference

## Requirements

- Node.js (v18 or higher)
- MongoDB (local installation or Atlas account)
- npm or yarn
- Basic understanding of testing concepts

## Testing Tools

- Jest: JavaScript testing framework
- React Testing Library: Testing utilities for React
- Supertest: HTTP assertions for API testing
- Cypress/Playwright: End-to-end testing framework
- MongoDB Memory Server: In-memory MongoDB for testing

## Submission

Your work will be automatically submitted when you push to your GitHub Classroom repository. Make sure to:

1. Complete all required tests (unit, integration, and end-to-end)
2. Achieve at least 70% code coverage for unit tests
3. Document your testing strategy in the README.md
4. Include screenshots of your test coverage reports
5. Demonstrate debugging techniques in your code

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Cypress Documentation](https://docs.cypress.io/)
- [MongoDB Testing Best Practices](https://www.mongodb.com/blog/post/mongodb-testing-best-practices) 