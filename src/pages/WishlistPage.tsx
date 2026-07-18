import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Bell } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { wishlistApi } from '../lib/api';
import { toWishlistItem } from '../lib/mappers';
import type { WishlistItem } from '../types';

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    wishlistApi.get()
      .then((r) => setItems(r.data.map(toWishlistItem)))
      .catch(() => {});
  }, []);

  const remove = async (id: string) => {
    try {
      await wishlistApi.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* ignore */ }
  };

  const toggleAlert = async (id: string) => {
    const next = new Set(alertedIds);
    const enabling = !next.has(id);
    if (next.has(id)) next.delete(id); else next.add(id);
    setAlertedIds(next);
    try { await wishlistApi.setPriceAlert(id, enabling); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text">
              My Wishlist
            </h1>
            <p className="text-thrift-text-secondary mt-1">{items.length} saved items</p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setItems([])}>
              Clear All
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-thrift-error/10 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-thrift-error" />
            </div>
            <h2 className="text-lg font-medium text-thrift-text mb-2">Your wishlist is empty</h2>
            <p className="text-thrift-text-secondary mb-6">
              Save items you love by tapping the heart icon
            </p>
            <Link to="/browse">
              <Button>Browse Listings</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const listing = item.listing;
              return (
              <div
                key={item.id}
                className="bg-thrift-surface border border-thrift-border rounded-card overflow-hidden hover:shadow-lift transition-all group"
              >
                <Link to={`/listings/${listing.id}`} className="block relative aspect-[4/3]">
                  <img
                    src={listing.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={listing.status === 'active' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {listing.status === 'active' ? 'Available' : 'Sold'}
                    </Badge>
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/listings/${listing.id}`}>
                    <h3 className="font-medium text-thrift-text line-clamp-1 hover:text-thrift-primary transition-colors">
                      {listing.title}
                    </h3>
                  </Link>
                  <p className="text-lg font-semibold text-thrift-primary mt-1">
                    NPR {listing.price.toLocaleString()}
                  </p>
                  {listing.originalPrice && (
                    <p className="text-sm text-thrift-text-secondary line-through">
                      NPR {listing.originalPrice.toLocaleString()}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    {listing.status === 'active' ? (
                      <Link to={`/checkout/${listing.id}`} className="flex-1">
                        <Button size="sm" className="w-full" icon={<ShoppingCart className="w-4 h-4" />}>
                          Buy Now
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" className="flex-1" disabled>
                        Sold Out
                      </Button>
                    )}
                    <button
                      onClick={() => toggleAlert(item.id)}
                      title={alertedIds.has(item.id) ? 'Price alert on' : 'Set price alert'}
                      className={`p-2 rounded-btn border transition-colors ${
                        alertedIds.has(item.id)
                          ? 'border-thrift-primary bg-thrift-primary/10 text-thrift-primary'
                          : 'border-thrift-border text-thrift-text-secondary hover:border-thrift-primary'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      title="Remove from wishlist"
                      className="p-2 rounded-btn border border-thrift-border text-thrift-text-secondary hover:border-thrift-error hover:text-thrift-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 p-4 bg-thrift-primary/5 border border-thrift-primary/20 rounded-card flex items-center gap-3">
            <Bell className="w-5 h-5 text-thrift-primary flex-shrink-0" />
            <p className="text-sm text-thrift-primary">
              Price alerts are active on{' '}
              <span className="font-medium">{alertedIds.size} item{alertedIds.size !== 1 ? 's' : ''}</span>.
              We'll notify you when prices drop.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
