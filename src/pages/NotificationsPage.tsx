import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingCart, MessageCircle, TrendingDown, Star, Shield, Package, Check, Trash2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { notificationsApi } from '../lib/api';
import { toNotification } from '../lib/mappers';
import type { Notification } from '../types';

const typeConfig: Record<
  Notification['type'],
  { icon: React.ReactNode; bg: string; link?: string }
> = {
  order: { icon: <ShoppingCart className="w-4 h-4" />, bg: 'bg-thrift-primary/10 text-thrift-primary', link: '/orders' },
  message: { icon: <MessageCircle className="w-4 h-4" />, bg: 'bg-thrift-secondary/10 text-thrift-secondary', link: '/messages' },
  'price-drop': { icon: <TrendingDown className="w-4 h-4" />, bg: 'bg-thrift-success/10 text-thrift-success', link: '/wishlist' },
  offer: { icon: <Package className="w-4 h-4" />, bg: 'bg-thrift-warning/10 text-thrift-warning', link: '/dashboard/seller' },
  review: { icon: <Star className="w-4 h-4" />, bg: 'bg-thrift-warning/10 text-thrift-warning', link: '/dashboard/seller' },
  security: { icon: <Shield className="w-4 h-4" />, bg: 'bg-thrift-error/10 text-thrift-error', link: '/settings' },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    notificationsApi.get()
      .then((r) => setNotifications(r.data.notifications.map(toNotification)))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await notificationsApi.markRead(id).catch(() => {});
  };

  const remove = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await notificationsApi.delete(id).catch(() => {});
  };

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-thrift-text-secondary mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 border border-thrift-border rounded-btn overflow-hidden">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    filter === f ? 'bg-thrift-primary text-white' : 'text-thrift-text-secondary hover:bg-thrift-bg'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-thrift-border/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-thrift-text-secondary" />
            </div>
            <p className="text-thrift-text-secondary">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((n) => {
              const cfg = typeConfig[n.type];
              const body = (
                <>
                  <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${n.read ? 'text-thrift-text-secondary' : 'text-thrift-text'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-thrift-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-thrift-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-thrift-text-secondary mt-1.5">{n.timestamp}</p>
                  </div>
                </>
              );

              return (
                <div
                  key={n.id}
                  className={`bg-thrift-surface border rounded-card overflow-hidden transition-all ${
                    n.read ? 'border-thrift-border' : 'border-thrift-primary/30 shadow-card'
                  }`}
                >
                  {cfg.link ? (
                    <Link to={cfg.link} className="flex items-start gap-4 p-4" onClick={() => markRead(n.id)}>
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-4 p-4" onClick={() => markRead(n.id)}>
                      {body}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 px-4 pb-3 -mt-1">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="flex items-center gap-1 text-xs text-thrift-primary hover:underline"
                      >
                        <Check className="w-3 h-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => remove(n.id)}
                      className="flex items-center gap-1 text-xs text-thrift-text-secondary hover:text-thrift-error transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Dismiss
                    </button>
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
