import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Remove the boot splash once React mounts
const splash = document.getElementById('splash');
if (splash) {
  splash.style.opacity = '0';
  setTimeout(() => splash.remove(), 400);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
