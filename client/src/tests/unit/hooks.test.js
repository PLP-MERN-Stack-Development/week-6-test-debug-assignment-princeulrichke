import { renderHook, waitFor, act } from '@testing-library/react';
import { useApi, useAuth, useForm } from '../../hooks';
import * as api from '../../utils/api';

// Mock the API module
jest.mock('../../utils/api');

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useApi('/test'));
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
  });

  it('should fetch data automatically on mount', async () => {
    const mockData = { id: 1, name: 'Test' };
    api.apiRequest.mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi('/test'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(api.apiRequest).toHaveBeenCalledWith('/test', {});
  });

  it('should not fetch data automatically when immediate is false', () => {
    const { result } = renderHook(() => 
      useApi('/test', { immediate: false })
    );

    expect(result.current.loading).toBe(false);
    expect(api.apiRequest).not.toHaveBeenCalled();
  });

  it('should handle errors correctly', async () => {
    const errorMessage = 'API Error';
    api.apiRequest.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should execute manually with custom parameters', async () => {
    const mockData = { id: 2, name: 'Manual Test' };
    api.apiRequest.mockResolvedValue(mockData);

    const { result } = renderHook(() => 
      useApi('/test', { immediate: false })
    );

    await act(async () => {
      await result.current.execute('/custom', { method: 'POST' });
    });

    expect(result.current.data).toEqual(mockData);
    expect(api.apiRequest).toHaveBeenCalledWith('/custom', { method: 'POST' });
  });
});

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(true);
  });

  it('should verify token on mount if present', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    api.apiRequest.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(api.apiRequest).toHaveBeenCalledWith('/api/auth/verify', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' }
    });
  });

  it('should handle invalid token', async () => {
    localStorage.setItem('token', 'invalid-token');
    api.apiRequest.mockRejectedValue(new Error('Invalid token'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should login successfully', async () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockResponse = { 
      token: 'new-token',
      user: { id: 1, email: 'test@example.com' }
    };
    api.apiRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(result.current.user).toEqual(mockResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('should logout successfully', async () => {
    // Setup authenticated state
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    api.apiRequest.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should register successfully', async () => {
    const userData = { 
      name: 'Test User',
      email: 'test@example.com', 
      password: 'password' 
    };
    const mockResponse = { 
      token: 'new-token',
      user: { id: 1, name: 'Test User', email: 'test@example.com' }
    };
    api.apiRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register(userData);
    });

    expect(result.current.user).toEqual(mockResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('new-token');
  });
});

describe('useForm Hook', () => {
  it('should initialize with default values', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle value changes', () => {
    const { result } = renderHook(() => useForm({ name: '', email: '' }));

    act(() => {
      result.current.handleChange('name', 'John Doe');
    });

    expect(result.current.values.name).toBe('John Doe');
  });

  it('should clear errors when value changes', () => {
    const validate = (values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name is required';
      return errors;
    };

    const { result } = renderHook(() => useForm({ name: '' }, validate));

    // Trigger validation error
    act(() => {
      result.current.handleBlur('name');
    });

    expect(result.current.errors.name).toBe('Name is required');

    // Clear error by changing value
    act(() => {
      result.current.handleChange('name', 'John');
    });

    expect(result.current.errors.name).toBe('');
  });

  it('should handle blur events and validation', () => {
    const validate = (values) => {
      const errors = {};
      if (!values.email.includes('@')) {
        errors.email = 'Invalid email';
      }
      return errors;
    };

    const { result } = renderHook(() => 
      useForm({ email: 'invalid-email' }, validate)
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.touched.email).toBe(true);
    expect(result.current.errors.email).toBe('Invalid email');
  });

  it('should handle form submission with validation', async () => {
    const validate = (values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name is required';
      if (!values.email) errors.email = 'Email is required';
      return errors;
    };

    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm({ name: '', email: '' }, validate)
    );

    await act(async () => {
      await result.current.handleSubmit(onSubmit);
    });

    expect(result.current.errors.name).toBe('Name is required');
    expect(result.current.errors.email).toBe('Email is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should submit successfully with valid data', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() => 
      useForm({ name: 'John', email: 'john@example.com' })
    );

    await act(async () => {
      await result.current.handleSubmit(onSubmit);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com'
    });
  });

  it('should reset form to initial values', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues));

    // Make changes
    act(() => {
      result.current.handleChange('name', 'John');
      result.current.handleBlur('name');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });
});
