import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { WishlistProvider } from './contexts/WishlistContext.tsx';
import { ConfirmProvider } from './contexts/ConfirmContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WishlistProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </WishlistProvider>
    </AuthProvider>
  </StrictMode>
);
