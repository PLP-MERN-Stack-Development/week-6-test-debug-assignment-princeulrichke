import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Button from './components/Button';
import LoginForm from './components/LoginForm';
import './App.css';

// Dashboard component
const Dashboard = () => {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <Button onClick={fetchPosts} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Posts'}
      </Button>
      <div className="posts-list">
        {posts.map(post => (
          <div key={post._id} className="post-item">
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <small>By: {post.author?.name}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

// Test component to trigger errors for testing ErrorBoundary
const ErrorTestComponent = () => {
  const [shouldError, setShouldError] = React.useState(false);

  if (shouldError) {
    throw new Error('Test error for ErrorBoundary');
  }

  return (
    <div className="error-test">
      <h2>Error Boundary Test</h2>
      <p>Click the button below to trigger an error and test the Error Boundary:</p>
      <Button onClick={() => setShouldError(true)} variant="danger">
        Trigger Error
      </Button>
    </div>
  );
};

// Navigation component
const Navigation = () => (
  <nav className="navigation">
    <div className="nav-brand">
      <Link to="/">MERN App</Link>
    </div>
    <ul className="nav-links">
      <li><Link to="/">Home</Link></li>
      <li><Link to="/login">Login</Link></li>
      <li><Link to="/dashboard">Dashboard</Link></li>
      <li><Link to="/error-test">Error Test</Link></li>
    </ul>
  </nav>
);

// Home component
const Home = () => (
  <div className="home">
    <h1>Welcome to MERN Testing App</h1>
    <p>This application demonstrates comprehensive testing strategies including:</p>
    <ul>
      <li>Unit Testing with Jest and React Testing Library</li>
      <li>Integration Testing with Supertest</li>
      <li>End-to-End Testing with Cypress/Playwright</li>
      <li>Error Boundaries for React components</li>
      <li>Performance monitoring and debugging</li>
    </ul>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/error-test" element={<ErrorTestComponent />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
