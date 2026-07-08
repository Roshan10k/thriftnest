import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, TrendingUp, Star, MessageCircle, ThumbsUp, Shield, Flag, ShoppingBag } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ListingCard } from '../components/cards/ListingCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { usersApi, listingsApi, reviewsApi } from '../lib/api';
import { toUser, toListing, toReview } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import type { User, Listing, Review } from '../types';

type Tab = 'listings' | 'reviews' | 'about';

export function UserProfilePage() {
  const { id: rawId } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  // "/profile" or "/users/me" → resolve to the authenticated user's real ID
  const id = (!rawId || rawId === 'me') ? (authUser?.id ?? '') : rawId;
  const isOwnProfile = !!authUser && authUser.id === id;
  const [activeTab, setActiveTab] = useState<Tab>('listings');

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
  const userListings: Listing[] = listingsData ?? [];
  const reviews: Review[] = reviewsData ?? [];

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      {/* Profile Header */}
      <div className="bg-thrift-surface border-b border-thrift-border">
        <div className="relative h-48 bg-gradient-to-r from-thrift-primary/20 to-thrift-secondary/20">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/profilebg/1200/300')] bg-cover bg-center opacity-30" />
        </div>
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative -mt-16 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=5C8A5C&color=fff&size=200`}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-thrift-surface object-cover"
              />
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
                  <Button icon={<MessageCircle className="w-4 h-4" />}>
                    Message {user.name.split(' ')[0]}
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-6">
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
                  <p className="font-semibold text-thrift-text">{user.rating}</p>
                  <p className="text-xs text-thrift-text-secondary">Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-thrift-success/10 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-thrift-success" />
                </div>
                <div>
                  <p className="font-semibold text-thrift-text">{user.responseRate}%</p>
                  <p className="text-xs text-thrift-text-secondary">Response Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-thrift-secondary/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-thrift-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-thrift-text">{user.purchaseCount}</p>
                  <p className="text-xs text-thrift-text-secondary">Purchases</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-6 border-b border-thrift-border">
          {[
            { id: 'listings' as Tab, label: 'Listings', count: userListings.length },
            { id: 'reviews' as Tab, label: 'Reviews', count: user.reviewCount },
            { id: 'about' as Tab, label: 'About' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
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
        {activeTab === 'listings' && (
          <div className="fade-in">
            <div className="flex gap-2 mb-6">
              {['All', 'Active', 'Sold'].map((filter) => (
                <button
                  key={filter}
                  className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                    filter === 'All' ? 'bg-thrift-primary text-white' : 'bg-thrift-border text-thrift-text-secondary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="fade-in">
            {/* Rating Breakdown */}
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
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-4">{rating}</span>
                    <Star className="w-3 h-3 text-thrift-warning fill-thrift-warning" />
                    <div className="flex-1 h-2 bg-thrift-border rounded-full overflow-hidden">
                      <div className="h-full bg-thrift-warning rounded-full" style={{ width: `${rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 8 : 2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Cards */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-thrift-surface border border-thrift-border rounded-card p-4">
                  <div className="flex items-start gap-4">
                    <img src={review.reviewer.avatar} alt={review.reviewer.name} className="w-10 h-10 rounded-full" />
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
          </div>
        )}

        {activeTab === 'about' && (
          <div className="fade-in">
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
              <h3 className="font-semibold text-thrift-text mb-4">About {user.name}</h3>
              <p className="text-thrift-text-secondary mb-6">
                Vintage enthusiast and collector based in {user.location}. I love finding unique pre-owned treasures and giving them a new home. All my items are honestly described and well-packaged for shipping. Feel free to message me with any questions!
              </p>

              <h4 className="text-sm font-medium text-thrift-text mb-2">Preferred Categories</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Clothing', 'Electronics', 'Art'].map((cat) => (
                  <Badge key={cat} variant="neutral">{cat}</Badge>
                ))}
              </div>

              <div className="pt-6 border-t border-thrift-border text-right">
                <button className="text-sm text-thrift-text-secondary hover:text-thrift-error flex items-center gap-1 ml-auto">
                  <Flag className="w-4 h-4" />
                  Report this user
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Message Button */}
      {!isOwnProfile && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button className="w-full" icon={<MessageCircle className="w-4 h-4" />}>
            Message {user.name.split(' ')[0]}
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
}
