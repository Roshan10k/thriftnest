import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Menu, X, Heart, Bell, Search, LogOut, User as UserIcon, Package, Settings, ChevronDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { notificationsApi } from '../../lib/api';
import { UserAvatar } from '../ui/UserAvatar';

// Fetches the unread notification count so the bell dot reflects real state.
// The navbar re-mounts on navigation, so the count refreshes as the user moves
// around (e.g. after marking all read on the notifications page).
function useUnreadCount(enabled: boolean) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!enabled) { setUnread(0); return; }
    let cancelled = false;
    notificationsApi.get()
      .then((r) => { if (!cancelled) setUnread(Number(r.data.unread) || 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled]);
  return unread;
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const unreadCount = useUnreadCount(isAuthenticated);
  const confirm = useConfirm();

  const isSeller = user?.role === 'seller';
  const isBoth = user?.role === 'both';

  const navLinks = isAuthenticated
    ? isSeller
      ? [
          { label: 'My Listings', path: '/listings' },
          { label: 'Messages', path: '/messages' },
        ]
      : isBoth
      ? [
          { label: 'Browse', path: '/browse' },
          { label: 'Wishlist', path: '/wishlist' },
          { label: 'My Listings', path: '/listings' },
          { label: 'Orders', path: '/orders' },
          { label: 'Messages', path: '/messages' },
        ]
      : [
          { label: 'Browse', path: '/browse' },
          { label: 'Wishlist', path: '/wishlist' },
          { label: 'Orders', path: '/orders' },
          { label: 'Messages', path: '/messages' },
        ]
    : [
        { label: 'Browse', path: '/browse' },
        { label: 'How it Works', path: '/#how-it-works' },
        { label: 'About', path: '/about' },
      ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return location.pathname === '/';
    return location.pathname === path;
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    const { confirmed } = await confirm({ title: 'Log out?', message: 'You will need to sign in again to access your account.', confirmLabel: 'Log out' });
    if (!confirmed) return;
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-thrift-surface border-b border-thrift-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to={isAuthenticated ? ((user?.role === 'seller' || user?.role === 'both') ? '/dashboard/seller' : '/dashboard/buyer') : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-thrift-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-playfair text-xl font-semibold text-thrift-primary">
                ThriftNest
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-thrift-primary'
                      : 'text-thrift-text-secondary hover:text-thrift-text'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? null : isAuthenticated ? (
              <>
                {!isSeller && (
                  <>
                    <Link
                      to="/browse"
                      className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors"
                      aria-label="Search"
                    >
                      <Search className="w-5 h-5" />
                    </Link>
                    <Link
                      to="/wishlist"
                      className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors"
                      aria-label="Wishlist"
                    >
                      <Heart className="w-5 h-5" />
                    </Link>
                  </>
                )}
                <Link
                  to="/notifications"
                  className="relative p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-thrift-error rounded-full" />
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-thrift-border hover:border-thrift-primary/50 transition-colors"
                  >
                    <UserAvatar src={user?.avatar} name={user?.name} className="w-7 h-7 rounded-full" />
                    <span className="text-sm font-medium text-thrift-text">
                      {user?.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-thrift-text-secondary" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-thrift-surface border border-thrift-border rounded-card shadow-lift z-20 overflow-hidden">
                        <div className="p-3 border-b border-thrift-border">
                          <p className="text-sm font-medium text-thrift-text">{user?.name}</p>
                          <p className="text-xs text-thrift-text-secondary">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to={`/users/${user?.id}`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-thrift-text-secondary" />
                            My Profile
                          </Link>
                          <Link
                            to={user?.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer'}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg transition-colors"
                          >
                            <Package className="w-4 h-4 text-thrift-text-secondary" />
                            {user?.role === 'both' ? 'Buyer Dashboard' : 'Dashboard'}
                          </Link>
                          {user?.role === 'both' && (
                            <Link
                              to="/dashboard/seller"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg transition-colors"
                            >
                              <TrendingUp className="w-4 h-4 text-thrift-text-secondary" />
                              Seller Dashboard
                            </Link>
                          )}
                          <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg transition-colors"
                          >
                            <Settings className="w-4 h-4 text-thrift-text-secondary" />
                            Settings
                          </Link>
                        </div>
                        <div className="border-t border-thrift-border py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-thrift-error hover:bg-thrift-error/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-thrift-primary border border-thrift-primary rounded-btn hover:bg-thrift-primary/5 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-thrift-primary rounded-btn hover:bg-thrift-primary/90 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-thrift-border bg-thrift-surface">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2 text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-thrift-primary'
                    : 'text-thrift-text-secondary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-thrift-border space-y-2">
              {isLoading ? null : isAuthenticated ? (
                <>
                  <Link
                    to={(user?.role === 'seller' || user?.role === 'both') ? '/dashboard/seller' : '/dashboard/buyer'}
                    className="block w-full text-center py-2.5 text-sm font-medium text-thrift-primary border border-thrift-primary rounded-btn"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                    className="block w-full text-center py-2.5 text-sm font-medium text-thrift-error border border-thrift-error rounded-btn"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block w-full text-center py-2.5 text-sm font-medium text-thrift-primary border border-thrift-primary rounded-btn"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center py-2.5 text-sm font-medium text-white bg-thrift-primary rounded-btn"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export function DashboardNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const unreadCount = useUnreadCount(!!user);
  const confirm = useConfirm();

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    const { confirmed } = await confirm({ title: 'Log out?', message: 'You will need to sign in again to access your account.', confirmLabel: 'Log out' });
    if (!confirmed) return;
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-thrift-surface border-b border-thrift-border">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-thrift-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-playfair text-lg font-semibold text-thrift-text">ThriftNest</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <Link
              to="/notifications"
              className="relative p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-thrift-error rounded-full" />
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2"
              >
                <UserAvatar src={user?.avatar} name={user?.name} className="w-8 h-8 rounded-full border border-thrift-border" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-thrift-text">{user?.name?.split(' ')[0] || 'User'}</p>
                  <p className="text-xs text-thrift-text-secondary capitalize">{user?.role || 'Member'}</p>
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-thrift-surface border border-thrift-border rounded-card shadow-lift z-20 overflow-hidden">
                    <div className="py-1">
                      {user?.role === 'both' && (
                        <>
                          <Link to="/dashboard/buyer" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg">
                            <Package className="w-4 h-4 text-thrift-text-secondary" />
                            Buyer Dashboard
                          </Link>
                          <Link to="/dashboard/seller" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg">
                            <TrendingUp className="w-4 h-4 text-thrift-text-secondary" />
                            Seller Dashboard
                          </Link>
                          <div className="border-t border-thrift-border my-1" />
                        </>
                      )}
                      <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-thrift-text hover:bg-thrift-bg">
                        <Settings className="w-4 h-4 text-thrift-text-secondary" />
                        Settings
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-thrift-error hover:bg-thrift-error/5">
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
