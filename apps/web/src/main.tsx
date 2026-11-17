import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SharedProfilePage } from './components/SharedProfilePage';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el elemento #root');

const sharedProfile = location.pathname.match(/^\/s\/([^/]+)\/?$/);
const content = sharedProfile?.[1] ? (
  <SharedProfilePage slug={decodeURIComponent(sharedProfile[1])} />
) : (
  <App />
);

createRoot(container).render(<StrictMode>{content}</StrictMode>);
