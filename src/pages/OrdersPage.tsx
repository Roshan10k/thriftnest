import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ordersApi } from '../lib/api';
import { toOrder } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import type { Order, OrderStatus } from '../types';

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'neutral'; icon: React.ReactNode }
> = {
  'payment-pending': { label: 'Payment Pending', variant: 'warning', icon: <Clock className="w-4 h-4" /> },
  'payment-confirmed': { label: 'Confirmed', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  shipped: { label: 'Shipped', variant: 'warning', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Delivered', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  disputed: { label: 'Disputed', variant: 'error', icon: <XCircle className="w-4 h-4" /> },
  refunded: { label: 'Refunded', variant: 'neutral', icon: <XCircle className="w-4 h-4" /> },
};

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data: ordersData, refetch } = useApi(() =>
    ordersApi.mine().then((r) => r.data.orders.map(toOrder)),
  );
  const allOrders: Order[] = ordersData ?? [];

  const [payingId, setPayingId] = useState<string | null>(null);
  const handlePay = async (orderId: string) => {
    setPayingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, { status: 'payment-confirmed' });
      await refetch();
    } catch { /* keep the order in pending state on failure */ }
    finally { setPayingId(null); }
  };

  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const handleMarkDelivered = async (orderId: string) => {
    setDeliveringId(orderId);
    try {
      await ordersApi.updateStatus(orderId, { status: 'delivered' });
      await refetch();
    } catch { /* keep the order shipped on failure */ }
    finally { setDeliveringId(null); }
  };

  const filtered = allOrders.filter((o) => {
    const matchSearch =
      !search ||
      o.listing.title.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());

    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'active' && ['payment-pending', 'payment-confirmed', 'shipped'].includes(o.status)) ||
      (activeTab === 'delivered' && o.status === 'delivered') ||
      (activeTab === 'cancelled' && ['disputed', 'refunded'].includes(o.status));

    return matchSearch && matchTab;
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All Orders' },
    { id: 'active', label: 'Active' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-6">My Orders</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thrift-text-secondary" />
          <input
            type="text"
            placeholder="Search by item name or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-thrift-surface border border-thrift-border rounded-input text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-thrift-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'text-thrift-primary border-thrift-primary'
                  : 'text-thrift-text-secondary border-transparent hover:text-thrift-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-thrift-border mb-4" />
            <h2 className="text-lg font-medium text-thrift-text mb-2">No orders found</h2>
            <p className="text-thrift-text-secondary mb-6">
              {search ? 'Try a different search term' : "You haven't placed any orders yet"}
            </p>
            <Link to="/browse">
              <Button>Browse Listings</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const cfg = statusConfig[order.status];
              return (
                <div
                  key={order.id}
                  className="bg-thrift-surface border border-thrift-border rounded-card p-4 hover:shadow-lift transition-all"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={order.listing.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
                      alt={order.listing.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-thrift-text">{order.listing.title}</p>
                          <p className="text-xs text-thrift-text-secondary mt-0.5">
                            Order #{order.id} · {order.createdAt}
                          </p>
                          <p className="text-xs text-thrift-text-secondary">
                            Sold by {order.seller.name}
                          </p>
                        </div>
                        <Badge variant={cfg.variant} size="sm">
                          {cfg.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="font-semibold text-thrift-primary">
                          NPR {order.totalAmount.toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              icon={<CheckCircle className="w-4 h-4" />}
                              loading={deliveringId === order.id}
                              onClick={() => handleMarkDelivered(order.id)}
                            >
                              {deliveringId === order.id ? 'Confirming…' : 'Mark as Delivered'}
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <Link to={`/orders/${order.id}`}>
                              <Button size="sm" variant="outline">
                                Leave Review
                              </Button>
                            </Link>
                          )}
                          {order.status === 'payment-pending' && (
                            <Button
                              size="sm"
                              loading={payingId === order.id}
                              onClick={() => handlePay(order.id)}
                            >
                              {payingId === order.id ? 'Processing…' : 'Complete Payment'}
                            </Button>
                          )}
                          <Link to={`/orders/${order.id}`}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
