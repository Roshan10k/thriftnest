import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, CreditCard, FileText, Flag, TrendingUp, AlertTriangle, Search, Ban, Trash2, Eye, RotateCcw, DollarSign } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { adminApi } from '../../lib/api';
import { toUser, toListing, toOrder } from '../../lib/mappers';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { User, Listing, Order } from '../../types';

type AdminTab = 'overview' | 'users' | 'listings' | 'orders' | 'transactions' | 'logs' | 'reports';

const sidebarSections = [
  {
    items: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', path: '/admin' },
      { icon: <Users className="w-5 h-5" />, label: 'Users', path: '/admin/users' },
      { icon: <Package className="w-5 h-5" />, label: 'Listings', path: '/admin/listings' },
      { icon: <ShoppingCart className="w-5 h-5" />, label: 'Orders', path: '/admin/orders' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Transactions', path: '/admin/transactions' },
      { icon: <FileText className="w-5 h-5" />, label: 'Activity Logs', path: '/admin/logs' },
      { icon: <Flag className="w-5 h-5" />, label: 'Reports & Flags', path: '/admin/reports' },
    ],
  },
];

interface AdminLog { id: string; timestamp: string; action: string; ipAddress: string; status: string; userId?: string; userAgent?: string }
interface AdminTx { id: string; type: string; amount: number; method: string; status: string; timestamp?: string }

export function AdminDashboard() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminListings, setAdminListings] = useState<Listing[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [adminTx, setAdminTx] = useState<AdminTx[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(() => adminApi.users().then((r) => setAdminUsers(r.data.users.map(toUser))).catch(() => {}), []);
  const loadListings = useCallback(() => adminApi.listings().then((r) => setAdminListings(r.data.listings.map(toListing))).catch(() => {}), []);
  const loadOrders = useCallback(() => adminApi.orders().then((r) => setAdminOrders(r.data.orders.map(toOrder))).catch(() => {}), []);

  useEffect(() => {
    loadUsers();
    loadListings();
    loadOrders();
    adminApi.logs().then((r) => setAdminLogs(r.data.logs as unknown as AdminLog[])).catch(() => {});
    adminApi.transactions().then((r) => setAdminTx(r.data.transactions as unknown as AdminTx[])).catch(() => {});
  }, [loadUsers, loadListings, loadOrders]);

  // ── Moderation actions ────────────────────────────────────────────────
  const handleToggleBan = async (user: User) => {
    const suspending = !user.suspended;
    const { confirmed } = await confirm({
      title: suspending ? `Suspend ${user.name}?` : `Reinstate ${user.name}?`,
      message: suspending
        ? 'The user will be logged out immediately and blocked from signing in until reinstated.'
        : 'The user will be able to sign in again.',
      confirmLabel: suspending ? 'Suspend' : 'Reinstate',
      danger: suspending,
    });
    if (!confirmed) return;
    setBusyId(user.id);
    try {
      await (suspending ? adminApi.banUser(user.id) : adminApi.unbanUser(user.id));
      await loadUsers();
    } catch { /* ignore */ } finally { setBusyId(null); }
  };

  const handleDeleteUser = async (user: User) => {
    const { confirmed } = await confirm({
      title: `Delete ${user.name}?`,
      message: 'This permanently deletes the user account. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    setBusyId(user.id);
    try { await adminApi.deleteUser(user.id); await loadUsers(); }
    catch { /* ignore */ } finally { setBusyId(null); }
  };

  const handleRemoveListing = async (listing: Listing) => {
    const { confirmed } = await confirm({
      title: `Remove "${listing.title}"?`,
      message: 'This takes the listing down from the marketplace.',
      confirmLabel: 'Remove listing',
      danger: true,
    });
    if (!confirmed) return;
    setBusyId(listing.id);
    try { await adminApi.removeListing(listing.id); await loadListings(); }
    catch { /* ignore */ } finally { setBusyId(null); }
  };

  const handleResolveOrder = async (order: Order) => {
    const { confirmed } = await confirm({
      title: 'Resolve this dispute?',
      message: 'The order will be refunded and the item returned to the marketplace.',
      confirmLabel: 'Refund & resolve',
      danger: true,
    });
    if (!confirmed) return;
    setBusyId(order.id);
    try { await adminApi.resolveOrder(order.id); await loadOrders(); }
    catch { /* ignore */ } finally { setBusyId(null); }
  };

  const totalRevenue = adminOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const flaggedCount = adminListings.filter((l) => l.status === 'flagged').length;
  const activeListingCount = adminListings.filter((l) => l.status === 'active').length;

  const stats = [
    { label: 'Total Users', value: adminUsers.length.toLocaleString(), icon: <Users className="w-5 h-5" /> },
    { label: 'Active Listings', value: activeListingCount.toLocaleString(), icon: <Package className="w-5 h-5" /> },
    { label: 'Total Revenue', value: totalRevenue > 0 ? `NPR ${totalRevenue.toLocaleString()}` : '—', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Flagged Items', value: flaggedCount.toLocaleString(), icon: <AlertTriangle className="w-5 h-5" />, highlight: flaggedCount > 0 },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Overview</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-white border rounded-card p-5 ${stat.highlight ? 'border-thrift-error' : 'border-thrift-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.highlight ? 'bg-thrift-error/10 text-thrift-error' : 'bg-thrift-primary/10 text-thrift-primary'}`}>
                {stat.icon}
              </div>
              {'change' in stat && <span className={`text-sm ${'change' in stat && (stat as {change:string}).change.startsWith('+') ? 'text-thrift-success' : 'text-thrift-error'}`}>{(stat as {change:string}).change}</span>}
            </div>
            <p className="text-2xl font-semibold text-thrift-text">{stat.value}</p>
            <p className="text-sm text-thrift-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-thrift-border rounded-card p-6">
          <h3 className="font-semibold text-thrift-text mb-4">User Signups (Last 30 Days)</h3>
          <div className="h-48 flex items-end gap-1">
            {[35, 42, 38, 50, 45, 55, 60, 52, 48, 65, 70, 75, 68, 72, 80, 85, 78, 90, 95, 88, 92, 100, 95, 105, 110, 102, 108, 115, 120, 125].map((val, i) => (
              <div key={i} className="flex-1 bg-thrift-primary rounded-t" style={{ height: `${(val / 125) * 100}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-thrift-border rounded-card p-6">
          <h3 className="font-semibold text-thrift-text mb-4">Sales by Category</h3>
          <div className="space-y-3">
            {['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports'].map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1/3 text-sm text-thrift-text">{cat}</div>
                <div className="flex-1 h-6 bg-thrift-border rounded-full overflow-hidden">
                  <div className="h-full bg-thrift-primary rounded-full" style={{ width: `${[45, 35, 30, 25, 20][i]}%` }} />
                </div>
                <span className="text-sm text-thrift-text-secondary">{[45, 35, 30, 25, 20][i]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-thrift-border rounded-card p-6">
        <h3 className="font-semibold text-thrift-text mb-4">Recent Activity</h3>
        <div className="font-jetbrains text-xs bg-thrift-admin text-white p-4 rounded-lg max-h-48 overflow-y-auto">
          {[...adminLogs].reverse().map((log) => (
            <div key={log.id} className={`py-1 ${log.status === 'failed' ? 'text-thrift-error' : 'text-green-400'}`}>
              [{log.timestamp}] {log.action} | {log.ipAddress} | {log.status === 'success' ? 'OK' : 'FAILED'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Users</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thrift-text-secondary" />
            <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 border border-thrift-border rounded-input text-sm" />
          </div>
          <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
            <option>All Roles</option>
            <option>Buyer</option>
            <option>Seller</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-thrift-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-thrift-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-thrift-border">
            {adminUsers.map((user) => (
              <tr key={user.id} className="hover:bg-thrift-bg/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar src={user.avatar} name={user.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-thrift-text">{user.name}</p>
                      <p className="text-xs text-thrift-text-secondary">ID: {user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-thrift-text">{user.email}</td>
                <td className="px-4 py-4">
                  <Badge variant={user.role === 'both' ? 'info' : user.role === 'seller' ? 'warning' : 'neutral'}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={user.suspended ? 'error' : user.verified ? 'success' : 'warning'}>
                    {user.suspended ? 'Suspended' : user.verified ? 'Active' : 'Pending'}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-thrift-text-secondary">{user.memberSince}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/users/${user.id}`} className="p-1.5 text-thrift-text-secondary hover:text-thrift-primary" title="View profile"><Eye className="w-4 h-4" /></Link>
                    <button
                      onClick={() => handleToggleBan(user)}
                      disabled={busyId === user.id}
                      title={user.suspended ? 'Reinstate' : 'Suspend'}
                      className={`p-1.5 disabled:opacity-40 ${user.suspended ? 'text-thrift-success hover:text-thrift-success' : 'text-thrift-text-secondary hover:text-thrift-warning'}`}
                    >
                      {user.suspended ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={busyId === user.id}
                      title="Delete user"
                      className="p-1.5 text-thrift-text-secondary hover:text-thrift-error disabled:opacity-40"
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
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Activity Logs</h1>

      <div className="flex items-center gap-4 mb-4">
        <input type="text" placeholder="Filter by User ID" className="px-3 py-2 border border-thrift-border rounded-input text-sm" />
        <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
          <option>All Actions</option>
          <option>LOGIN_SUCCESS</option>
          <option>LOGIN_FAILED</option>
          <option>LISTING_CREATED</option>
        </select>
        <input type="date" className="px-3 py-2 border border-thrift-border rounded-input text-sm" />
        <Button variant="outline" size="sm">Export</Button>
      </div>

      <div className="bg-thrift-admin text-white rounded-card p-4 font-jetbrains text-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-thrift-text-secondary text-left">
              <th className="pb-3 px-2">Timestamp</th>
              <th className="pb-3 px-2">User ID</th>
              <th className="pb-3 px-2">Action</th>
              <th className="pb-3 px-2">IP Address</th>
              <th className="pb-3 px-2">User Agent</th>
              <th className="pb-3 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {adminLogs.map((log) => (
              <tr key={log.id} className={`border-t border-white/10 ${log.ipAddress === '203.0.113.42' ? 'bg-thrift-error/20' : ''}`}>
                <td className="py-2 px-2">{log.timestamp}</td>
                <td className="py-2 px-2">{log.userId}</td>
                <td className="py-2 px-2">{log.action}</td>
                <td className={`py-2 px-2 font-mono ${log.ipAddress === '203.0.113.42' ? 'text-thrift-error' : ''}`}>{log.ipAddress}</td>
                <td className="py-2 px-2">{log.userAgent}</td>
                <td className="py-2 px-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-thrift-success' : 'bg-thrift-error'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const listingStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    active: { label: 'Active', variant: 'success' },
    sold: { label: 'Sold', variant: 'neutral' },
    paused: { label: 'Paused', variant: 'warning' },
    removed: { label: 'Removed', variant: 'error' },
    flagged: { label: 'Flagged', variant: 'error' },
  };

  const orderStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    'payment-pending': { label: 'Payment Pending', variant: 'warning' },
    'payment-confirmed': { label: 'Confirmed', variant: 'success' },
    shipped: { label: 'Shipped', variant: 'warning' },
    delivered: { label: 'Delivered', variant: 'success' },
    disputed: { label: 'Disputed', variant: 'error' },
    refunded: { label: 'Refunded', variant: 'neutral' },
  };

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Listings</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thrift-text-secondary" />
            <input type="text" placeholder="Search listings..." className="pl-10 pr-4 py-2 border border-thrift-border rounded-input text-sm bg-white" />
          </div>
          <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
            <option>All Categories</option>
            <option>Clothing</option>
            <option>Electronics</option>
            <option>Books</option>
          </select>
          <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
            <option>All Status</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Flagged</option>
          </select>
        </div>
      </div>
      <div className="bg-white border border-thrift-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-thrift-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Listing</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Seller</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Views</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-thrift-border">
            {adminListings.map((listing) => {
              const cfg = listingStatusConfig[listing.status] || listingStatusConfig.active;
              return (
                <tr key={listing.id} className="hover:bg-thrift-bg/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"} alt={listing.title} className="w-10 h-10 rounded-lg object-cover" />
                      <p className="text-sm font-medium text-thrift-text max-w-[200px] truncate">{listing.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-thrift-text">{listing.seller.name}</td>
                  <td className="px-4 py-3 text-sm text-thrift-text-secondary capitalize">{listing.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-thrift-primary">NPR {listing.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-thrift-text-secondary">{listing.views}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/listings/${listing.id}`} className="p-1.5 text-thrift-text-secondary hover:text-thrift-primary" title="View listing"><Eye className="w-4 h-4" /></Link>
                      {listing.status !== 'removed' && (
                        <button
                          onClick={() => handleRemoveListing(listing)}
                          disabled={busyId === listing.id}
                          title="Remove listing"
                          className="p-1.5 text-thrift-text-secondary hover:text-thrift-error disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Orders</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thrift-text-secondary" />
            <input type="text" placeholder="Search orders..." className="pl-10 pr-4 py-2 border border-thrift-border rounded-input text-sm bg-white" />
          </div>
          <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
            <option>All Status</option>
            <option>Payment Pending</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Disputed</option>
          </select>
        </div>
      </div>
      <div className="bg-white border border-thrift-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-thrift-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Buyer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Seller</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-thrift-border">
            {adminOrders.map((order) => {
              const cfg = orderStatusConfig[order.status] || orderStatusConfig.shipped;
              return (
                <tr key={order.id} className={`hover:bg-thrift-bg/50 ${order.status === 'disputed' ? 'bg-thrift-error/5' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-thrift-text">{order.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={order.listing.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'} alt="" className="w-8 h-8 rounded object-cover" />
                      <p className="text-sm text-thrift-text max-w-[140px] truncate">{order.listing.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-thrift-text">{order.buyer.name}</td>
                  <td className="px-4 py-3 text-sm text-thrift-text">{order.seller.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-thrift-primary">NPR {order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-thrift-text-secondary">{order.createdAt}</td>
                  <td className="px-4 py-3"><Badge variant={cfg.variant} size="sm">{cfg.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/orders/${order.id}`} className="p-1.5 text-thrift-text-secondary hover:text-thrift-primary" title="View order"><Eye className="w-4 h-4" /></Link>
                      {order.status === 'disputed' && (
                        <button
                          onClick={() => handleResolveOrder(order)}
                          disabled={busyId === order.id}
                          className="px-2 py-1 text-xs bg-thrift-error text-white rounded hover:bg-thrift-error/90 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Transactions</h1>
        <div className="flex items-center gap-4">
          <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
            <option>All Methods</option>
            <option>Stripe</option>
            <option>eSewa</option>
            <option>Khalti</option>
          </select>
          <select className="px-3 py-2 border border-thrift-border rounded-input text-sm bg-white">
            <option>All Types</option>
            <option>Payment</option>
            <option>Refund</option>
            <option>Withdrawal</option>
          </select>
          <Button variant="outline" size="sm" icon={<DollarSign className="w-4 h-4" />}>Export CSV</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: 'NPR 1,24,500', change: '+18%', positive: true },
          { label: 'Platform Fees', value: 'NPR 6,225', change: '+18%', positive: true },
          { label: 'Refunds Issued', value: 'NPR 4,800', change: '-3%', positive: false },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-thrift-border rounded-card p-4">
            <p className="text-sm text-thrift-text-secondary">{s.label}</p>
            <p className="text-xl font-semibold text-thrift-text mt-1">{s.value}</p>
            <p className={`text-xs mt-1 ${s.positive ? 'text-thrift-success' : 'text-thrift-error'}`}>{s.change} this month</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-thrift-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-thrift-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Transaction ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-thrift-text-secondary uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-thrift-border">
            {adminTx.map((tx) => (
              <tr key={tx.id} className="hover:bg-thrift-bg/50">
                <td className="px-4 py-3 font-mono text-xs text-thrift-text">{tx.id}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={tx.type === 'payment' ? 'success' : tx.type === 'refund' ? 'error' : 'warning'}
                    size="sm"
                  >
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-thrift-text">
                  <span className={tx.type === 'refund' ? 'text-thrift-error' : 'text-thrift-success'}>
                    {tx.type === 'refund' ? '−' : '+'}NPR {tx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    tx.method === 'stripe' ? 'bg-blue-50 text-blue-700' :
                    tx.method === 'esewa' ? 'bg-green-50 text-green-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {tx.method.charAt(0).toUpperCase() + tx.method.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'error' : 'warning'}
                    size="sm"
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-thrift-text-secondary">{tx.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const flaggedListings = adminListings.filter((l) => l.status === 'flagged' || (l as Listing & { flagCount?: number }).flagCount);
  const renderReports = () => (
    <div className="space-y-6">
      <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Reports &amp; Flags</h1>

      {flaggedListings.length === 0 ? (
        <div className="bg-white border border-thrift-border rounded-card p-10 text-center">
          <Flag className="w-10 h-10 text-thrift-border mx-auto mb-3" />
          <p className="text-thrift-text font-medium">No flagged content</p>
          <p className="text-sm text-thrift-text-secondary mt-1">Listings marked as flagged for review will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedListings.map((listing) => (
            <div key={listing.id} className="bg-white border border-thrift-border rounded-card p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-thrift-warning/10 text-thrift-warning">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-thrift-text">{listing.title}</p>
                  <Badge variant="warning">Flagged</Badge>
                </div>
                <p className="text-sm text-thrift-text-secondary">Seller: {listing.seller.name} · NPR {listing.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/listings/${listing.id}`}><Button variant="outline" size="sm">View</Button></Link>
                <Button variant="danger" size="sm" loading={busyId === listing.id} onClick={() => handleRemoveListing(listing)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-thrift-bg flex">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-thrift-admin flex-shrink-0 fixed left-0 top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-thrift-admin" />
            </div>
            <span className="font-playfair text-lg font-semibold">Admin</span>
          </Link>
        </div>
        <nav className="p-4">
          {sidebarSections[0].items.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label.toLowerCase().replace(/ & /, '-').replace(' ', '-') as AdminTab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                item.label.toLowerCase().replace(/ & /, '-').replace(' ', '-') === activeTab
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-60 flex-1">
        <main className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'listings' && renderListings()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'reports' && renderReports()}
        </main>
      </div>
    </div>
  );
}
