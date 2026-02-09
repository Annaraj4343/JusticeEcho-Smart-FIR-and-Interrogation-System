
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create a root for React to render into
const rootElement = document.getElementById("root");

// Make sure the element exists before attempting to render
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}
