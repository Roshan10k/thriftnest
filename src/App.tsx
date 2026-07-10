import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Component, type ReactNode } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-thrift-bg p-8 text-center">
          <h1 className="text-2xl font-semibold text-thrift-error mb-2">Something went wrong</h1>
          <p className="text-thrift-text-secondary mb-6 text-sm max-w-md">{(this.state.error as Error).message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            className="px-4 py-2 bg-thrift-primary text-white rounded-btn text-sm"
          >
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { BackupCodePage } from './pages/auth/BackupCodePage';
import { BrowsePage } from './pages/BrowsePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { EditListingPage } from './pages/EditListingPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MessagesPage } from './pages/MessagesPage';
import { BuyerDashboard } from './pages/dashboard/BuyerDashboard';
import { SellerDashboard } from './pages/dashboard/SellerDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { WishlistPage } from './pages/WishlistPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AboutPage } from './pages/AboutPage';
import { HelpPage } from './pages/HelpPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { NotFoundPage } from './pages/ErrorPage';

function SellerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'buyer') return <Navigate to="/dashboard/buyer" replace />;
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to={user.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />

          {/* Auth */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/backup-code" element={<BackupCodePage />} />

          {/* Listings — /new and /my must come before /:id */}
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listings" element={<SellerRoute><MyListingsPage /></SellerRoute>} />
          <Route path="/listings/new" element={<SellerRoute><CreateListingPage /></SellerRoute>} />
          <Route path="/listings/:id/edit" element={<SellerRoute><EditListingPage /></SellerRoute>} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />

          {/* Checkout */}
          <Route path="/checkout/:id?" element={<RequireAuth><CheckoutPage /></RequireAuth>} />

          {/* User pages */}
          <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><UserProfilePage /></RequireAuth>} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

          {/* Dashboards */}
          <Route path="/dashboard/buyer" element={<RequireAuth><BuyerDashboard /></RequireAuth>} />
          <Route path="/dashboard/seller" element={<RequireAuth><SellerDashboard /></RequireAuth>} />
          {/* Seller orders-to-ship: redirect to dashboard where that section lives */}
          <Route path="/orders/ship" element={<Navigate to="/dashboard/seller" replace />} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/*" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ToastProvider>
    </ErrorBoundary>
  );
}
