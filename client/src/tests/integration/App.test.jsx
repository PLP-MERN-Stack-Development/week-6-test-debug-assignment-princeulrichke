import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { server } from '../__mocks__/server';
import { rest } from 'msw';

// Helper to render App with Router
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Integration Tests', () => {
  it('renders home page by default', () => {
    renderApp();
    
    expect(screen.getByText('Welcome to MERN Testing App')).toBeInTheDocument();
    expect(screen.getByText(/This application demonstrates/)).toBeInTheDocument();
  });

  it('navigates to login page', async () => {
    renderApp();
    
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard page', async () => {
    renderApp();
    
    fireEvent.click(screen.getByText('Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Refresh Posts')).toBeInTheDocument();
    });
  });

  it('displays error boundary when error test is triggered', async () => {
    renderApp();
    
    // Navigate to error test page
    fireEvent.click(screen.getByText('Error Test'));
    
    await waitFor(() => {
      expect(screen.getByText('Error Boundary Test')).toBeInTheDocument();
    });

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Error'));
    
    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });
});

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Mock successful posts API response
    server.use(
      rest.get('/api/posts', (req, res, ctx) => {
        return res(
          ctx.json([
            {
              _id: '1',
              title: 'Test Post 1',
              content: 'This is test content 1',
              author: { name: 'John Doe' }
            },
            {
              _id: '2',
              title: 'Test Post 2',
              content: 'This is test content 2',
              author: { name: 'Jane Smith' }
            }
          ])
        );
      })
    );
  });

  it('fetches and displays posts on load', async () => {
    renderApp();
    
    // Navigate to dashboard
    fireEvent.click(screen.getByText('Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      expect(screen.getByText('This is test content 1')).toBeInTheDocument();
      expect(screen.getByText('By: John Doe')).toBeInTheDocument();
    });
  });

  it('handles refresh posts button', async () => {
    renderApp();
    
    // Navigate to dashboard
    fireEvent.click(screen.getByText('Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Click refresh
    fireEvent.click(screen.getByText('Refresh Posts'));
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Refresh Posts')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    server.use(
      rest.get('/api/posts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    // Mock console.error to avoid cluttering test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderApp();
    
    // Navigate to dashboard
    fireEvent.click(screen.getByText('Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Should handle error gracefully (component doesn't crash)
    expect(screen.getByText('Refresh Posts')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});

describe('LoginForm Integration Tests', () => {
  beforeEach(() => {
    // Mock successful login response
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            token: 'mock-token',
            user: { id: 1, email: 'test@example.com', name: 'Test User' }
          })
        );
      })
    );
  });

  it('submits login form with valid data', async () => {
    renderApp();
    
    // Navigate to login
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });
  });

  it('handles login error', async () => {
    // Mock login error
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Invalid credentials' })
        );
      })
    );

    renderApp();
    
    // Navigate to login
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    // Fill form with invalid data
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'invalid@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderApp();
    
    // Navigate to login
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderApp();
    
    // Navigate to login
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    // Enter invalid email
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'invalid-email' }
    });
    fireEvent.blur(screen.getByPlaceholderText('Email'));
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });
});
