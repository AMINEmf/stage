import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './index.css'; // Import Tailwind CSS après Bootstrap

// Ajout React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('API_TOKEN');
  if (token) {
    config.headers = config.headers || {};
    const existingAuth = config.headers.Authorization || config.headers.authorization;
    if (!existingAuth || existingAuth === 'Bearer null' || existingAuth === 'Bearer undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const originalFetch = window.fetch;
window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;
  if (
    url &&
    (url.startsWith('http://localhost:8000/api/') ||
      url.startsWith('http://127.0.0.1:8000/api/'))
  ) {
    const token = localStorage.getItem('API_TOKEN');
    if (token) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      const existingAuth = headers.get('Authorization');
      if (!existingAuth || existingAuth === 'Bearer null' || existingAuth === 'Bearer undefined') {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init = { ...init, headers };
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
  </React.StrictMode>,
);
