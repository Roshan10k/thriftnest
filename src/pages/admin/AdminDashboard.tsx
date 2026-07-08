import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, CreditCard, FileText, Flag, Settings, TrendingUp, AlertTriangle, Search, Ban, Trash2, Eye, Pause, DollarSign, Save } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../lib/api';
import { toUser, toListing, toOrder } from '../../lib/mappers';
import type { User, Listing, Order } from '../../types';

type AdminTab = 'overview' | 'users' | 'listings' | 'orders' | 'transactions' | 'logs' | 'reports' | 'settings';

const sidebarSections = [
  {
    items: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', path: '/admin' },
      { icon: <Users className="w-5 h-5" />, label: 'Users', path: '/admin/users' },
      { icon: <Package className="w-5 h-5" />, label: 'Listings', path: '/admin/listings' },
      { icon: <ShoppingCart className="w-5 h-5" />, label: 'Orders', path: '/admin/orders' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Transactions', path: '/admin/transactions' },
      { icon: <FileText className="w-5 h-5" />, label: 'Activity Logs', path: '/admin/logs' },
      { icon: <Flag className="w-5 h-5" />, label: 'Reports & Flags', path: '/admin/reports', badge: 7 },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/admin/settings' },
    ],
  },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminListings, setAdminListings] = useState<Listing[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminLogs, setAdminLogs] = useState<Record<string, unknown>[]>([]);
  const [adminTx, setAdminTx] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    adminApi.users().then((r) => setAdminUsers(r.data.users.map(toUser))).catch(() => {});
    adminApi.listings().then((r) => setAdminListings(r.data.listings.map(toListing))).catch(() => {});
    adminApi.orders().then((r) => setAdminOrders(r.data.orders.map(toOrder))).catch(() => {});
    adminApi.logs().then((r) => setAdminLogs(r.data.logs)).catch(() => {});
    adminApi.transactions().then((r) => setAdminTx(r.data.transactions)).catch(() => {});
  }, []);

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
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
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
                  <Badge variant={user.verified ? 'success' : 'warning'}>{user.verified ? 'Active' : 'Pending'}</Badge>
                </td>
                <td className="px-4 py-4 text-sm text-thrift-text-secondary">{user.memberSince}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-thrift-text-secondary hover:text-thrift-primary"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-thrift-text-secondary hover:text-thrift-warning"><Ban className="w-4 h-4" /></button>
                    <button className="p-1.5 text-thrift-text-secondary hover:text-thrift-error"><Trash2 className="w-4 h-4" /></button>
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
                      <Link to={`/listings/${listing.id}`} className="p-1.5 text-thrift-text-secondary hover:text-thrift-primary"><Eye className="w-4 h-4" /></Link>
                      <button className="p-1.5 text-thrift-text-secondary hover:text-thrift-warning"><Pause className="w-4 h-4" /></button>
                      <button className="p-1.5 text-thrift-text-secondary hover:text-thrift-error"><Trash2 className="w-4 h-4" /></button>
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
                      <Link to={`/orders/${order.id}`} className="p-1.5 text-thrift-text-secondary hover:text-thrift-primary"><Eye className="w-4 h-4" /></Link>
                      {order.status === 'disputed' && (
                        <button className="px-2 py-1 text-xs bg-thrift-error text-white rounded hover:bg-thrift-error/90">Resolve</button>
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

  const renderSettings = () => (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Platform Settings</h1>

      {/* Platform Fees */}
      <div className="bg-white border border-thrift-border rounded-card p-6">
        <h2 className="font-semibold text-thrift-text mb-4">Transaction Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-thrift-text">Platform Fee (%)</p>
              <p className="text-sm text-thrift-text-secondary">Applied to every completed sale</p>
            </div>
            <input type="number" defaultValue={5} min={0} max={20} className="w-20 px-3 py-2 border border-thrift-border rounded-input text-sm text-right" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-thrift-text">Minimum Listing Price (NPR)</p>
              <p className="text-sm text-thrift-text-secondary">Items below this price cannot be listed</p>
            </div>
            <input type="number" defaultValue={50} min={0} className="w-24 px-3 py-2 border border-thrift-border rounded-input text-sm text-right" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-thrift-text">Buyer Protection Window (days)</p>
              <p className="text-sm text-thrift-text-secondary">Days after delivery to open a dispute</p>
            </div>
            <input type="number" defaultValue={3} min={1} max={30} className="w-16 px-3 py-2 border border-thrift-border rounded-input text-sm text-right" />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-thrift-border rounded-card p-6">
        <h2 className="font-semibold text-thrift-text mb-4">Security Settings</h2>
        <div className="space-y-4">
          {[
            { label: 'Enforce MFA for all users', desc: 'Require 2FA on every account', defaultChecked: false },
            { label: 'Rate limiting on auth endpoints', desc: 'Block after 5 failed attempts', defaultChecked: true },
            { label: 'CAPTCHA on registration', desc: 'Show CAPTCHA challenge during sign-up', defaultChecked: true },
            { label: 'IP blocking for suspicious logins', desc: 'Auto-block IPs with >10 failed attempts', defaultChecked: true },
            { label: 'Session binding to user agent', desc: 'Invalidate session on device change', defaultChecked: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-thrift-text">{setting.label}</p>
                <p className="text-sm text-thrift-text-secondary">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={setting.defaultChecked} className="sr-only peer" />
                <div className="w-11 h-6 bg-thrift-border rounded-full peer peer-checked:bg-thrift-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Content Moderation */}
      <div className="bg-white border border-thrift-border rounded-card p-6">
        <h2 className="font-semibold text-thrift-text mb-4">Content Moderation</h2>
        <div className="space-y-4">
          {[
            { label: 'Auto-remove flagged listings', desc: 'Remove after 3 independent reports', defaultChecked: false },
            { label: 'Email alerts on new reports', desc: 'Notify admin on every new flag', defaultChecked: true },
            { label: 'Require seller verification', desc: 'ID verification before listing', defaultChecked: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-thrift-text">{setting.label}</p>
                <p className="text-sm text-thrift-text-secondary">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={setting.defaultChecked} className="sr-only peer" />
                <div className="w-11 h-6 bg-thrift-border rounded-full peer peer-checked:bg-thrift-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button icon={<Save className="w-4 h-4" />}>Save Settings</Button>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Reports & Flags</h1>

      <div className="space-y-4">
        {[
          { type: 'listing', title: 'Harley Davidson Jacket', reporter: 'Sita M.', reason: 'Counterfeit item', date: '2024-01-15', action: 'pending' },
          { type: 'user', title: 'user_847', reporter: 'Maya T.', reason: 'Scam attempt', date: '2024-01-14', action: 'pending' },
          { type: 'listing', title: 'Rolex Watch', reporter: 'Hari T.', reason: 'Stolen item reported', date: '2024-01-13', action: 'removed' },
        ].map((report, idx) => (
          <div key={idx} className="bg-white border border-thrift-border rounded-card p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.type === 'listing' ? 'bg-thrift-warning/10 text-thrift-warning' : 'bg-thrift-error/10 text-thrift-error'}`}>
              {report.type === 'listing' ? <Package className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-thrift-text">{report.title}</p>
                <Badge variant={report.action === 'pending' ? 'warning' : 'neutral'}>{report.action}</Badge>
              </div>
              <p className="text-sm text-thrift-text-secondary">Reported for: {report.reason}</p>
              <p className="text-xs text-thrift-text-secondary mt-1">Reported by {report.reporter} on {report.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Dismiss</Button>
              <Button variant="outline" size="sm">Warn User</Button>
              <Button variant="danger" size="sm">Suspend</Button>
            </div>
          </div>
        ))}
      </div>
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
              {item.badge && (
                <span className="ml-auto bg-thrift-error text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
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
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}
