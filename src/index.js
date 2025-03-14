import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Create a root for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app inside the root
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
