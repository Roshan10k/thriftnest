import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, TrendingUp, Star, MessageCircle, Shield, ShoppingBag } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ListingCard } from '../components/cards/ListingCard';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
import { usersApi, listingsApi, reviewsApi, messagesApi } from '../lib/api';
import { toUser, toListing, toReview } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import type { User, Listing, Review } from '../types';

type Tab = 'listings' | 'reviews' | 'about';

export function UserProfilePage() {
  const { id: rawId } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  // "/profile" or "/users/me" → resolve to the authenticated user's real ID
  const id = (!rawId || rawId === 'me') ? (authUser?.id ?? '') : rawId;
  const isOwnProfile = !!authUser && authUser.id === id;
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [listingFilter, setListingFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [messaging, setMessaging] = useState(false);

  const startConversation = async () => {
    if (!authUser) { navigate('/login'); return; }
    setMessaging(true);
    try {
      await messagesApi.getOrCreate(id);
    } catch { /* ignore */ } finally {
      setMessaging(false);
      navigate('/messages');
    }
  };

  const { data: userData, loading } = useApi(
    () => (id ? usersApi.getById(id).then((r) => toUser(r.data)) : Promise.resolve(null as User | null)),
    [id],
  );
  const { data: listingsData } = useApi(
    () => (id ? listingsApi.browse({ sellerId: id, limit: 20 }).then((r) => r.data.listings.map(toListing)) : Promise.resolve([] as Listing[])),
    [id],
  );
  const { data: reviewsData } = useApi(
    () => (id ? reviewsApi.forSeller(id).then((r) => r.data.reviews.map(toReview)) : Promise.resolve([] as Review[])),
    [id],
  );

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-thrift-bg"><Navbar />
        <main className="max-w-5xl mx-auto px-4 py-20 text-center text-thrift-text-secondary">
          {loading ? 'Loading profile…' : 'User not found.'}
        </main>
        <Footer />
      </div>
    );
  }

  const user: User = userData;
  const isSeller = user.role === 'seller' || user.role === 'both';
  const userListings: Listing[] = listingsData ?? [];
  const reviews: Review[] = reviewsData ?? [];
  const filteredListings = userListings.filter((l) =>
    listingFilter === 'all' ? true : listingFilter === 'sold' ? l.status === 'sold' : l.status === 'active',
  );
  // Real rating distribution from the seller's reviews.
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => Math.round(r.rating) === star).length);
  const maxRatingCount = Math.max(1, ...ratingCounts);

  const profileTabs: { id: Tab; label: string; count?: number }[] = isSeller
    ? [
        { id: 'listings', label: 'Listings', count: userListings.length },
        { id: 'reviews', label: 'Reviews', count: user.reviewCount },
        { id: 'about', label: 'About' },
      ]
    : [{ id: 'about', label: 'About' }];
  const currentTab: Tab = isSeller ? activeTab : 'about';

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      {/* Profile Header */}
      <div className="bg-thrift-surface border-b border-thrift-border">
        <div className="relative h-40 bg-gradient-to-r from-thrift-primary/20 to-thrift-secondary/20" />
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative -mt-16 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <UserAvatar src={user.avatar} name={user.name} className="w-32 h-32 rounded-full border-4 border-thrift-surface" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-thrift-text">{user.name}</h1>
                  {user.verified && (
                    <div className="w-6 h-6 rounded-full bg-thrift-primary flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-thrift-text-secondary mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Member since {user.memberSince}
                  </span>
                </div>
              </div>
              {!isOwnProfile && (
                <div className="mt-4 sm:mt-0">
                  <Button icon={<MessageCircle className="w-4 h-4" />} loading={messaging} onClick={startConversation}>
                    Message {user.name.split(' ')[0]}
                  </Button>
                </div>
              )}
            </div>

            {/* Stats — seller-relevant vs buyer-relevant */}
            <div className="flex flex-wrap gap-6 mt-6">
              {isSeller ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-thrift-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-thrift-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-thrift-text">{user.salesCount}</p>
                      <p className="text-xs text-thrift-text-secondary">Sales</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-thrift-warning/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-thrift-warning fill-thrift-warning" />
                    </div>
                    <div>
                      <p className="font-semibold text-thrift-text">{user.reviewCount > 0 ? user.rating : '—'}</p>
                      <p className="text-xs text-thrift-text-secondary">{user.reviewCount} reviews</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-thrift-secondary/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-thrift-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-thrift-text">{user.purchaseCount}</p>
                    <p className="text-xs text-thrift-text-secondary">Purchases</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-6 border-b border-thrift-border">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-medium transition-colors border-b-2 -mb-px ${
                currentTab === tab.id
                  ? 'text-thrift-primary border-thrift-primary'
                  : 'text-thrift-text-secondary border-transparent hover:text-thrift-text'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-xs bg-thrift-border px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {currentTab === 'listings' && (
          <div className="fade-in">
            <div className="flex gap-2 mb-6">
              {(['all', 'active', 'sold'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setListingFilter(filter)}
                  className={`px-4 py-1.5 text-sm rounded-full transition-colors capitalize ${
                    listingFilter === filter ? 'bg-thrift-primary text-white' : 'bg-thrift-border text-thrift-text-secondary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            {filteredListings.length === 0 ? (
              <p className="text-sm text-thrift-text-secondary py-10 text-center">No {listingFilter === 'all' ? '' : listingFilter} listings to show.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'reviews' && (
          <div className="fade-in">
            {reviews.length === 0 ? (
              <p className="text-sm text-thrift-text-secondary py-10 text-center">No reviews yet.</p>
            ) : (
            <>
            {/* Rating Breakdown — from real reviews */}
            <div className="flex items-start gap-8 bg-thrift-surface border border-thrift-border rounded-card p-6 mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-thrift-text">{user.rating}</p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(user.rating) ? 'text-thrift-warning fill-thrift-warning' : 'text-thrift-border'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-thrift-text-secondary mt-1">{user.reviewCount} reviews</p>
              </div>

              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating, idx) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-4">{rating}</span>
                    <Star className="w-3 h-3 text-thrift-warning fill-thrift-warning" />
                    <div className="flex-1 h-2 bg-thrift-border rounded-full overflow-hidden">
                      <div className="h-full bg-thrift-warning rounded-full" style={{ width: `${(ratingCounts[idx] / maxRatingCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-thrift-text-secondary w-6 text-right">{ratingCounts[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Cards */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-thrift-surface border border-thrift-border rounded-card p-4">
                  <div className="flex items-start gap-4">
                    <UserAvatar src={review.reviewer.avatar} name={review.reviewer.name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-thrift-text">{review.reviewer.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-thrift-warning fill-thrift-warning' : 'text-thrift-border'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-thrift-text-secondary">{review.createdAt}</span>
                          </div>
                        </div>
                        <Link to={`/listings/${review.listing.id}`} className="text-xs text-thrift-primary hover:underline">
                          {review.listing.title}
                        </Link>
                      </div>
                      <p className="text-sm text-thrift-text-secondary mt-2">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        )}

        {currentTab === 'about' && (
          <div className="fade-in">
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
              <h3 className="font-semibold text-thrift-text mb-4">About {user.name}</h3>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-thrift-text-secondary">Role</dt>
                  <dd className="text-thrift-text font-medium capitalize">{isSeller ? 'Seller' : 'Buyer'}</dd>
                </div>
                <div>
                  <dt className="text-thrift-text-secondary">Member since</dt>
                  <dd className="text-thrift-text font-medium">{user.memberSince}</dd>
                </div>
                {user.location && (
                  <div>
                    <dt className="text-thrift-text-secondary">Location</dt>
                    <dd className="text-thrift-text font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-thrift-text-secondary">Verification</dt>
                  <dd className="text-thrift-text font-medium">{user.verified ? 'Verified' : 'Not verified'}</dd>
                </div>
                {isSeller && (
                  <div>
                    <dt className="text-thrift-text-secondary">Active listings</dt>
                    <dd className="text-thrift-text font-medium">{userListings.filter((l) => l.status === 'active').length}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Message Button */}
      {!isOwnProfile && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button className="w-full" icon={<MessageCircle className="w-4 h-4" />} loading={messaging} onClick={startConversation}>
            Message {user.name.split(' ')[0]}
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
}
