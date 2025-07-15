import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Log performance metrics
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Page Load Performance:', {
      loadTime: perfData.loadEventEnd - perfData.loadEventStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      totalTime: perfData.loadEventEnd - perfData.fetchStart
    });
  });
  
  // Log Core Web Vitals
  const logWebVitals = (vitals) => {
    console.log('Web Vitals:', vitals);
    // In production, send to analytics service
    // analytics.track('web-vitals', vitals);
  };
  
  // Lazy load web-vitals library
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(logWebVitals);
    getFID(logWebVitals);
    getFCP(logWebVitals);
    getLCP(logWebVitals);
    getTTFB(logWebVitals);
  });
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // errorTrackingService.logError(event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // errorTrackingService.logError(event.reason);
  }
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
