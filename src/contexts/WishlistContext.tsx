import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { wishlistApi } from '../lib/api';
import { toWishlistItem } from '../lib/mappers';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  isWishlisted: (listingId: string) => boolean;
  toggle: (listingId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setIds(new Set()); return; }
    setLoading(true);
    wishlistApi.get()
      .then((res) => setIds(new Set(res.data.map(toWishlistItem).map((item) => item.listing.id))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const isWishlisted = useCallback((listingId: string) => ids.has(listingId), [ids]);

  const toggle = useCallback(async (listingId: string) => {
    const wasWishlisted = ids.has(listingId);

    // Optimistic update, rolled back if the request fails.
    setIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) next.delete(listingId); else next.add(listingId);
      return next;
    });

    try {
      if (wasWishlisted) {
        await wishlistApi.remove(listingId);
      } else {
        await wishlistApi.add(listingId);
      }
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.add(listingId); else next.delete(listingId);
        return next;
      });
    }
  }, [ids]);

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
