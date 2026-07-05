import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Package, PlusCircle, Truck, MessageCircle, User, Settings, LogOut, Edit2, Pause, Play, Trash2, Search } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardNavbar } from '../components/layout/Navbar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { listingsApi } from '../lib/api';
import { toListing } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import type { Listing, ListingStatus } from '../types';

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

type FilterStatus = 'all' | ListingStatus;

export function MyListingsPage() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const sidebarUser = {
    name: authUser?.name ?? 'Seller',
    avatar: authUser?.avatar,
    role: 'Seller',
  };

  const { data: listingsData, refetch } = useApi(() =>
    listingsApi.mine(1, 50).then((r) => r.data.listings.map(toListing)),
  );

  const allListings: Listing[] = listingsData ?? [];

  const filtered = allListings.filter((l) => {
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchesSearch = search === '' || l.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts: Record<FilterStatus, number> = {
    all: allListings.length,
    active: allListings.filter((l) => l.status === 'active').length,
    paused: allListings.filter((l) => l.status === 'paused').length,
    sold: allListings.filter((l) => l.status === 'sold').length,
    removed: allListings.filter((l) => l.status === 'removed').length,
    flagged: allListings.filter((l) => l.status === 'flagged').length,
  };

  const handleTogglePause = async (listing: Listing) => {
    setTogglingId(listing.id);
    try {
      const next = listing.status === 'paused' ? 'active' : 'paused';
      await listingsApi.updateStatus(listing.id, next);
      refetch();
    } catch { /* ignore */ } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await listingsApi.delete(id);
      refetch();
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'paused', label: 'Paused' },
    { key: 'sold', label: 'Sold' },
  ];

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Sidebar sections={sidebarSections} user={sidebarUser} />

      <div className="ml-60">
        <DashboardNavbar />

        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text">My Listings</h1>
            <Link to="/listings/new">
              <Button icon={<PlusCircle className="w-4 h-4" />}>New Listing</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Status tabs */}
            <div className="flex gap-2 flex-wrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === tab.key
                      ? 'bg-thrift-primary text-white'
                      : 'bg-thrift-bg text-thrift-text-secondary hover:text-thrift-text'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    filterStatus === tab.key ? 'bg-white/20' : 'bg-thrift-border'
                  }`}>
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thrift-text-secondary" />
              <input
                type="text"
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-thrift-bg border border-thrift-border rounded-input text-sm w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-thrift-surface border border-thrift-border rounded-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 text-thrift-border mx-auto mb-3" />
                <p className="font-medium text-thrift-text mb-1">No listings found</p>
                <p className="text-sm text-thrift-text-secondary mb-4">
                  {search ? 'Try a different search term.' : 'Create your first listing to get started.'}
                </p>
                <Link to="/listings/new">
                  <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>New Listing</Button>
                </Link>
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
                    {filtered.map((listing) => (
                      <tr key={listing.id} className="hover:bg-thrift-bg/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={listing.images?.[0] || `https://ui-avatars.com/api/?name=Item&background=eee&color=999&size=48`}
                              alt={listing.title}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="font-medium text-thrift-text text-sm max-w-[180px] truncate">{listing.title}</p>
                              <p className="text-xs text-thrift-text-secondary">{listing.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-thrift-primary whitespace-nowrap">
                          NPR {listing.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-thrift-text-secondary capitalize">
                          {listing.category}
                        </td>
                        <td className="px-4 py-4 text-sm text-thrift-text-secondary capitalize">
                          {listing.condition.replace(/-/g, ' ')}
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
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/listings/${listing.id}/edit`}
                              className="p-2 text-thrift-text-secondary hover:text-thrift-primary transition-colors rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            {listing.status !== 'sold' && listing.status !== 'removed' && (
                              <button
                                onClick={() => handleTogglePause(listing)}
                                disabled={togglingId === listing.id}
                                className="p-2 text-thrift-text-secondary hover:text-thrift-warning transition-colors rounded disabled:opacity-40"
                                title={listing.status === 'paused' ? 'Resume' : 'Pause'}
                              >
                                {listing.status === 'paused'
                                  ? <Play className="w-4 h-4" />
                                  : <Pause className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={deletingId === listing.id}
                              className="p-2 text-thrift-text-secondary hover:text-thrift-error transition-colors rounded disabled:opacity-40"
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
        </main>
      </div>
    </div>
  );
}
