import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, MessageCircle, User, Settings, LogOut, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { DashboardNavbar } from '../../components/layout/Navbar';
import { ListingCard } from '../../components/cards/ListingCard';
import { Badge } from '../../components/ui/Badge';
import { ordersApi, wishlistApi, listingsApi } from '../../lib/api';
import { toOrder, toWishlistItem, toListing } from '../../lib/mappers';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import type { OrderStatus } from '../../types';


const statusLabels: Record<OrderStatus, string> = {
  'payment-pending': 'Payment Pending',
  'payment-confirmed': 'Payment Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  disputed: 'Disputed',
  refunded: 'Refunded',
};

const statusVariants: Record<OrderStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  'payment-pending': 'warning',
  'payment-confirmed': 'success',
  shipped: 'warning',
  delivered: 'neutral',
  disputed: 'error',
  refunded: 'neutral',
};

export function BuyerDashboard() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const sidebarSections = [
    {
      items: [
        { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard/buyer' },
        { icon: <Search className="w-5 h-5" />, label: 'Browse Listings', path: '/browse' },
        { icon: <ShoppingCart className="w-5 h-5" />, label: 'My Orders', path: '/orders' },
        { icon: <Heart className="w-5 h-5" />, label: 'Wishlist', path: '/wishlist' },
        { icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', path: '/messages' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
        { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
        { icon: <LogOut className="w-5 h-5" />, label: 'Logout', onClick: handleLogout },
      ],
    },
  ];

  const user = {
    name: authUser?.name ?? 'Buyer',
    avatar: authUser?.avatar,
    role: 'Buyer',
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const { data: ordersData } = useApi(() => ordersApi.mine().then((r) => r.data.orders.map(toOrder)));
  const { data: wishlistData } = useApi(() => wishlistApi.get().then((r) => r.data.map(toWishlistItem)));
  const { data: recommendedData } = useApi(() => listingsApi.browse({ limit: 8, sort: 'newest' }).then((r) => r.data.listings.map(toListing)));

  const orders = ordersData ?? [];
  const wishlist = wishlistData ?? [];
  const wishlistItems = wishlist.slice(0, 4).map((w) => w.listing);
  const recommendedItems = (recommendedData ?? []).slice(0, 4);

  const ordersInTransit = orders.filter((o) =>
    ['payment-confirmed', 'shipped'].includes(o.status),
  ).length;
  const totalSaved = wishlist.reduce(
    (sum, w) => sum + (w.listing.originalPrice ? w.listing.originalPrice - w.listing.price : 0),
    0,
  );

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Sidebar
        sections={sidebarSections}
        user={user}
        onLogout={() => {}}
      />

      <div className="ml-60">
        <DashboardNavbar />

        <main className="p-6">
          {/* Welcome Banner */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 mb-6">
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
              {greeting}, {authUser?.name ?? 'there'}
            </h1>
            <p className="text-thrift-text-secondary">
              {ordersInTransit > 0
                ? <>You have <span className="font-medium text-thrift-primary">{ordersInTransit} {ordersInTransit === 1 ? 'order' : 'orders'}</span> in transit</>
                : 'Welcome to your dashboard'}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-thrift-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-thrift-primary" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-thrift-text">{authUser?.purchaseCount ?? orders.length}</p>
              <p className="text-sm text-thrift-text-secondary">Items Purchased</p>
            </div>

            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-thrift-error/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-thrift-error" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-thrift-text">{wishlist.length}</p>
              <p className="text-sm text-thrift-text-secondary">Wishlist Items</p>
            </div>

            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-thrift-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-thrift-warning" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-thrift-text">{ordersInTransit}</p>
              <p className="text-sm text-thrift-text-secondary">Orders in Transit</p>
            </div>

            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-thrift-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-thrift-success" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-thrift-text">
                {totalSaved > 0 ? `NPR ${totalSaved.toLocaleString()}` : '—'}
              </p>
              <p className="text-sm text-thrift-text-secondary">Total Saved</p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card mb-6 overflow-hidden">
            <div className="p-4 border-b border-thrift-border flex justify-between items-center">
              <h2 className="font-semibold text-thrift-text">Your Orders</h2>
              <Link to="/orders" className="text-sm text-thrift-primary hover:underline">
                View all
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-thrift-text-secondary text-sm">
                No orders yet. <Link to="/browse" className="text-thrift-primary hover:underline">Start shopping</Link>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-thrift-bg text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Item</th>
                    <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Seller</th>
                    <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-thrift-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-thrift-bg/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={order.listing.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
                            alt={order.listing.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-thrift-text text-sm">{order.listing.title}</p>
                            <p className="text-xs text-thrift-text-secondary">{order.listing.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={order.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.seller.name || 'S')}&background=5C8A5C&color=fff&size=40`}
                            alt={order.seller.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-sm text-thrift-text">{order.seller.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-thrift-text">
                        NPR {order.listing.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-thrift-text-secondary">
                        {order.createdAt}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariants[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {order.status === 'shipped' ? (
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-sm text-thrift-primary hover:underline"
                          >
                            Track Order
                          </Link>
                        ) : order.status === 'delivered' ? (
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-sm text-thrift-primary hover:underline"
                          >
                            Leave Review
                          </Link>
                        ) : (
                          <span className="text-sm text-thrift-text-secondary">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Wishlist Preview */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-thrift-text">Your Wishlist</h2>
              <Link to="/wishlist" className="text-sm text-thrift-primary hover:underline flex items-center gap-1">
                View all <TrendingUp className="w-4 h-4" />
              </Link>
            </div>
            {wishlistItems.length === 0 ? (
              <p className="text-sm text-thrift-text-secondary py-4">
                No saved items yet. <Link to="/browse" className="text-thrift-primary hover:underline">Browse listings</Link> and tap the heart to save items.
              </p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {wishlistItems.map((item) => (
                  <Link key={item.id} to={`/listings/${item.id}`} className="flex-shrink-0 w-48">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.images?.[0] || 'https://ui-avatars.com/api/?name=Item&background=eee&color=999&size=200'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-thrift-text line-clamp-1">{item.title}</p>
                    <p className="text-thrift-primary font-semibold">NPR {item.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recommended */}
          <div>
            <h2 className="font-semibold text-thrift-text mb-4">Recommended for You</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedItems.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
