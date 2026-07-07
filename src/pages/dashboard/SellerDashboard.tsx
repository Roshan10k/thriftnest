import { Link, useNavigate } from 'react-router-dom';
import { Home, Package, PlusCircle, DollarSign, Truck, MessageCircle, User, Settings, LogOut, Edit2, Pause, Trash2, TrendingUp, Star, Clock, Play } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { DashboardNavbar } from '../../components/layout/Navbar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { listingsApi, ordersApi } from '../../lib/api';
import { toListing, toOrder } from '../../lib/mappers';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import type { ListingStatus } from '../../types';

const statusLabels: Record<ListingStatus, string> = {
  active: 'Active',
  sold: 'Sold',
  paused: 'Paused',
  removed: 'Removed',
  flagged: 'Flagged',
};

const statusVariants: Record<ListingStatus, 'success' | 'neutral' | 'warning' | 'error'> = {
  active: 'success',
  sold: 'neutral',
  paused: 'warning',
  removed: 'error',
  flagged: 'error',
};

export function SellerDashboard() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const sidebarSections = [
    {
      items: [
        { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard/seller' },
        { icon: <Package className="w-5 h-5" />, label: 'My Listings', path: '/listings' },
        { icon: <PlusCircle className="w-5 h-5" />, label: 'New Listing', path: '/listings/new' },
        { icon: <Truck className="w-5 h-5" />, label: 'Orders to Ship', path: '/orders/ship' },
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
    name: authUser?.name ?? 'Seller',
    avatar: authUser?.avatar,
    role: 'Seller',
  };

  const { data: listingsData, refetch: refetchListings } = useApi(() =>
    listingsApi.mine().then((r) => r.data.listings.map(toListing)),
  );
  const { data: sellerOrdersData, refetch: refetchOrders } = useApi(() =>
    ordersApi.sellerOrders().then((r) => r.data.orders.map(toOrder)),
  );

  const allListings = listingsData ?? [];
  const allOrders = sellerOrdersData ?? [];

  // Stats computed from real data
  const activeListings = allListings.filter((l) => l.status === 'active').length;
  const soldListings = allListings.filter((l) => l.status === 'sold').length;
  const totalEarned = allOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const avgRating = authUser?.rating ?? 0;

  const myListings = allListings.slice(0, 8);

  const ordersToShip = allOrders.filter(
    (o) => o.status === 'payment-confirmed',
  );

  const handleTogglePause = async (id: string, currentStatus: ListingStatus) => {
    setTogglingId(id);
    try {
      const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
      await listingsApi.updateStatus(id, newStatus);
      refetchListings();
    } catch { /* ignore */ } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    setDeletingId(id);
    try {
      await listingsApi.delete(id);
      refetchListings();
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const handleMarkShipped = async (orderId: string) => {
    setShippingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, { status: 'shipped' });
      refetchOrders();
    } catch { /* ignore */ } finally {
      setShippingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Sidebar sections={sidebarSections} user={user} />

      <div className="ml-60">
        <DashboardNavbar />

        <main className="p-6">
          {/* Welcome */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 mb-6">
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-1">
              Welcome back, {authUser?.name ?? 'Seller'}
            </h1>
            <p className="text-thrift-text-secondary">
              {ordersToShip.length > 0
                ? <><span className="font-medium text-thrift-primary">{ordersToShip.length} {ordersToShip.length === 1 ? 'order' : 'orders'}</span> waiting to be shipped</>
                : 'No pending shipments — all clear!'}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="w-10 h-10 rounded-lg bg-thrift-primary/10 flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-thrift-primary" />
              </div>
              <p className="text-2xl font-semibold text-thrift-text">{activeListings}</p>
              <p className="text-sm text-thrift-text-secondary">Active Listings</p>
            </div>

            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="w-10 h-10 rounded-lg bg-thrift-success/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-thrift-success" />
              </div>
              <p className="text-2xl font-semibold text-thrift-text">{soldListings}</p>
              <p className="text-sm text-thrift-text-secondary">Items Sold</p>
            </div>

            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="w-10 h-10 rounded-lg bg-thrift-secondary/10 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-thrift-secondary" />
              </div>
              <p className="text-2xl font-semibold text-thrift-text">
                {totalEarned > 0 ? `NPR ${totalEarned.toLocaleString()}` : '—'}
              </p>
              <p className="text-sm text-thrift-text-secondary">Total Earned</p>
            </div>

            <div className="bg-thrift-surface border border-thrift-border rounded-card p-5">
              <div className="w-10 h-10 rounded-lg bg-thrift-warning/10 flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-thrift-warning fill-thrift-warning" />
              </div>
              <p className="text-2xl font-semibold text-thrift-text">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </p>
              <p className="text-sm text-thrift-text-secondary">Avg Rating</p>
            </div>
          </div>

          {/* My Listings Table */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card mb-6 overflow-hidden">
            <div className="p-4 border-b border-thrift-border flex justify-between items-center">
              <h2 className="font-semibold text-thrift-text">My Listings</h2>
              <Link to="/listings/new">
                <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>Add New</Button>
              </Link>
            </div>
            {myListings.length === 0 ? (
              <div className="p-8 text-center text-thrift-text-secondary text-sm">
                No listings yet.{' '}
                <Link to="/listings/new" className="text-thrift-primary hover:underline">Create your first listing</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-thrift-bg text-left">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Item</th>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Price</th>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Condition</th>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Views</th>
                      <th className="px-4 py-3 text-xs font-semibold text-thrift-text-secondary uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-thrift-border">
                    {myListings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-thrift-bg/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={listing.images?.[0] || 'https://ui-avatars.com/api/?name=Item&background=eee&color=999&size=48'}
                              alt={listing.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <p className="font-medium text-thrift-text text-sm max-w-[200px] truncate">{listing.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-thrift-primary">
                          NPR {listing.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-thrift-text-secondary capitalize">
                          {listing.category}
                        </td>
                        <td className="px-4 py-4 text-sm text-thrift-text-secondary capitalize">
                          {listing.condition.replace('-', ' ')}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={statusVariants[listing.status]} size="sm">
                            {statusLabels[listing.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-thrift-text-secondary">
                          {listing.views}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/listings/${listing.id}/edit`}
                              className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleTogglePause(listing.id, listing.status)}
                              disabled={togglingId === listing.id || listing.status === 'sold'}
                              className="p-2 text-thrift-text-secondary hover:text-thrift-warning transition-colors disabled:opacity-40"
                              title={listing.status === 'paused' ? 'Resume' : 'Pause'}
                            >
                              {listing.status === 'paused'
                                ? <Play className="w-4 h-4" />
                                : <Pause className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={deletingId === listing.id}
                              className="p-2 text-thrift-text-secondary hover:text-thrift-error transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders to Ship */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-4">
            <h2 className="font-semibold text-thrift-text mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-thrift-primary" />
              Orders to Ship
            </h2>
            {ordersToShip.length === 0 ? (
              <p className="text-sm text-thrift-text-secondary text-center py-6">No pending shipments.</p>
            ) : (
              <div className="space-y-3">
                {ordersToShip.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border border-thrift-border bg-thrift-bg rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={order.buyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.buyer.name)}&background=5C8A5C&color=fff&size=40`}
                        alt={order.buyer.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-thrift-text">{order.buyer.name}</p>
                        <p className="text-sm text-thrift-text-secondary">{order.listing.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-thrift-text-secondary" />
                          <span className="text-xs text-thrift-text-secondary">
                            Ordered {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleMarkShipped(order.id)}
                      disabled={shippingId === order.id}
                    >
                      {shippingId === order.id ? 'Updating…' : 'Mark as Shipped'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
