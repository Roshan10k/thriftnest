import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, MessageCircle, ShoppingCart, MapPin, Clock, Star, Shield, User, Check, Package, Truck, Calendar } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ListingCard } from '../components/cards/ListingCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/modals/Modal';
import { UserAvatar } from '../components/ui/UserAvatar';
import { conditionLabels } from '../data/mockData';
import { listingsApi, reviewsApi, messagesApi } from '../lib/api';
import { toListing, toReview } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import type { Listing, Review } from '../types';

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const { isWishlisted: checkWishlisted, toggle: toggleWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [messagingLoading, setMessagingLoading] = useState(false);

  const { data: listingData, loading: listingLoading } = useApi(
    () => listingsApi.getById(id!).then((r) => toListing(r.data)),
    [id],
  );
  const { data: reviewsData } = useApi(
    () => id ? reviewsApi.forListing(id).then((r) => r.data.reviews.map(toReview)) : Promise.resolve([] as Review[]),
    [id],
  );
  const { data: similarData } = useApi(
    () => listingData
      ? listingsApi.browse({ category: listingData.category, limit: 4 }).then((r) => r.data.listings.map(toListing))
      : Promise.resolve([] as Listing[]),
    [listingData?.category],
  );

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-thrift-bg">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center text-thrift-text-secondary">Loading…</main>
        <Footer />
      </div>
    );
  }
  if (!listingData) {
    return (
      <div className="min-h-screen bg-thrift-bg">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center text-thrift-text-secondary">
          Listing not found. <button className="text-thrift-primary underline" onClick={() => navigate('/browse')}>Browse listings</button>
        </main>
        <Footer />
      </div>
    );
  }

  const listing = listingData;
  const wishlisted = checkWishlisted(listing.id);
  const reviews = reviewsData ?? [];
  const similarListings = (similarData ?? []).filter((l) => l.id !== id).slice(0, 4);
  const otherListings: Listing[] = [];

  const ratingBreakdown = { 5: 65, 4: 25, 3: 8, 2: 2, 1: 0 };

  const isOwnListing = isAuthenticated && authUser?.id === listing.seller.id;

  const handleMessageSeller = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setMessagingLoading(true);
    try {
      await messagesApi.getOrCreate(listing.seller.id, listing.id);
      navigate('/messages');
    } catch { navigate('/messages'); } finally { setMessagingLoading(false); }
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    toggleWishlist(id!);
  };

  const savings = listing.originalPrice ? listing.originalPrice - listing.price : 0;

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-thrift-text-secondary hover:text-thrift-text">Home</Link>
          <ChevronRight className="w-4 h-4 text-thrift-text-secondary" />
          <Link to="/browse" className="text-thrift-text-secondary hover:text-thrift-text">Browse</Link>
          <ChevronRight className="w-4 h-4 text-thrift-text-secondary" />
          <span className="text-thrift-text capitalize">{listing.category}</span>
          <ChevronRight className="w-4 h-4 text-thrift-text-secondary" />
          <span className="text-thrift-text truncate max-w-[200px]">{listing.title}</span>
        </nav>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Left - Images */}
          <div className="lg:w-3/5">
            <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-thrift-surface border border-thrift-border mb-4">
              <img
                src={listing.images[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                  wishlisted
                    ? 'bg-thrift-error text-white'
                    : 'bg-thrift-surface/80 backdrop-blur-sm text-thrift-text-secondary hover:text-thrift-error'
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage === index ? 'border-thrift-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right - Details */}
          <div className="lg:w-2/5">
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant={listing.condition === 'like-new' || listing.condition === 'brand-new' ? 'success' : listing.condition === 'good' ? 'warning' : 'neutral'}
                >
                  {conditionLabels[listing.condition]}
                </Badge>
                <span className="text-sm text-thrift-text-secondary">Posted {listing.listedAt}</span>
              </div>

              <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-3">
                {listing.title}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-thrift-primary">
                  NPR {listing.price.toLocaleString()}
                </span>
                {listing.originalPrice && (
                  <>
                    <span className="text-lg text-thrift-text-secondary line-through">
                      NPR {listing.originalPrice.toLocaleString()}
                    </span>
                    <Badge variant="success" size="sm">Save NPR {savings.toLocaleString()}</Badge>
                  </>
                )}
              </div>

              {listing.negotiable && (
                <div className="flex items-center gap-2 text-sm text-thrift-secondary mb-4">
                  <MessageCircle className="w-4 h-4" />
                  <span>Price negotiable</span>
                </div>
              )}

              {/* Seller Card */}
              <div className="border-t border-thrift-border pt-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar src={listing.seller.avatar} name={listing.seller.name} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-thrift-text">{listing.seller.name}</p>
                      {listing.seller.verified && (
                        <Check className="w-4 h-4 text-thrift-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-thrift-text-secondary">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-thrift-warning text-thrift-warning" />
                        {listing.seller.rating}
                      </div>
                      <span>({listing.seller.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-thrift-text-secondary mb-3">
                  Member since {listing.seller.memberSince} · Usually replies in 2 hours
                </p>
                <Link
                  to={`/users/${listing.seller.id}`}
                  className="text-sm text-thrift-primary hover:underline"
                >
                  View Profile
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isOwnListing && (
                  <Button
                    className="w-full"
                    size="lg"
                    icon={<ShoppingCart className="w-5 h-5" />}
                    onClick={() => navigate(isAuthenticated ? `/checkout/${listing.id}` : '/login')}
                  >
                    Buy Now — NPR {listing.price.toLocaleString()}
                  </Button>
                )}
                {!isOwnListing && (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    icon={<MessageCircle className="w-5 h-5" />}
                    onClick={handleMessageSeller}
                    loading={messagingLoading}
                  >
                    Message Seller
                  </Button>
                )}
                {!isOwnListing && (
                  <button
                    onClick={handleWishlistToggle}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-btn border transition-all ${
                      wishlisted
                        ? 'border-thrift-error bg-thrift-error/5 text-thrift-error'
                        : 'border-thrift-border text-thrift-text-secondary hover:border-thrift-primary hover:text-thrift-primary'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
                    {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                  </button>
                )}
              </div>

              {/* Safety Tip */}
              <div className="mt-6 p-4 bg-thrift-primary/5 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-thrift-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-thrift-text">Buyer Protection</p>
                    <p className="text-xs text-thrift-text-secondary mt-1">
                      Pay through the platform to stay protected. Get full refund if item doesn't match description.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 mb-8">
          <h2 className="font-semibold text-thrift-text mb-4">Description</h2>
          <p className="text-thrift-text-secondary whitespace-pre-line leading-relaxed mb-6">
            {listing.description}
          </p>

          {/* Details Table */}
          <div className="grid sm:grid-cols-2 gap-4 border-t border-thrift-border pt-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-thrift-text-secondary" />
              <div>
                <p className="text-sm text-thrift-text-secondary">Category</p>
                <p className="font-medium text-thrift-text capitalize">{listing.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-thrift-text-secondary" />
              <div>
                <p className="text-sm text-thrift-text-secondary">Condition</p>
                <p className="font-medium text-thrift-text">{conditionLabels[listing.condition]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-thrift-text-secondary" />
              <div>
                <p className="text-sm text-thrift-text-secondary">Location</p>
                <p className="font-medium text-thrift-text">{listing.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-thrift-text-secondary" />
              <div>
                <p className="text-sm text-thrift-text-secondary">Delivery</p>
                <p className="font-medium text-thrift-text">
                  {listing.deliveryAvailable && listing.pickupAvailable && 'Delivery & Pickup'}
                  {listing.deliveryAvailable && !listing.pickupAvailable && 'Delivery only'}
                  {!listing.deliveryAvailable && listing.pickupAvailable && 'Pickup only'}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            <span className="text-xs text-thrift-text-secondary">#electronics</span>
            <span className="text-xs text-thrift-text-secondary">#camera</span>
            <span className="text-xs text-thrift-text-secondary">#canon</span>
            <span className="text-xs text-thrift-text-secondary">#dslr</span>
          </div>
        </div>

        {/* Seller's Other Listings */}
        {otherListings.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-thrift-text mb-4">Seller's Other Listings</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {otherListings.map((item) => (
                <div key={item.id} className="w-64 flex-shrink-0">
                  <ListingCard listing={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 mb-8">
          <h2 className="font-semibold text-thrift-text mb-4">Reviews</h2>

          <div className="flex items-center gap-8 mb-6 pb-6 border-b border-thrift-border">
            <div className="text-center">
              <p className="text-4xl font-bold text-thrift-text">{listing.rating}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(listing.rating)
                        ? 'text-thrift-warning fill-thrift-warning'
                        : 'text-thrift-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-thrift-text-secondary mt-1">{listing.reviewCount} reviews</p>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="w-3 h-3 text-thrift-warning fill-thrift-warning" />
                  <div className="flex-1 h-2 bg-thrift-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-thrift-warning rounded-full"
                      style={{ width: `${ratingBreakdown[rating as keyof typeof ratingBreakdown]}%` }}
                    />
                  </div>
                  <span className="text-xs text-thrift-text-secondary w-10">
                    {ratingBreakdown[rating as keyof typeof ratingBreakdown]}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 mb-4 pb-4 border-b border-thrift-border last:border-0">
              <UserAvatar src={review.reviewer.avatar} name={review.reviewer.name} className="w-10 h-10 rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-thrift-text">{review.reviewer.name}</p>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? 'text-thrift-warning fill-thrift-warning'
                            : 'text-thrift-border'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-thrift-text-secondary">{review.createdAt}</span>
                </div>
                <p className="text-sm text-thrift-text-secondary">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <div>
            <h2 className="font-semibold text-thrift-text mb-4">Similar Listings</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarListings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Make Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        title="Make an Offer"
      >
        <div className="mb-4">
          <p className="text-sm text-thrift-text-secondary">Item</p>
          <p className="font-medium text-thrift-text">{listing.title}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-thrift-text-secondary">Current Price</p>
          <p className="font-semibold text-thrift-primary">NPR {listing.price.toLocaleString()}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-thrift-text mb-2">Your Offer</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-thrift-text-secondary">NPR</span>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="Enter your offer"
              className="w-full pl-12 pr-4 py-2 border border-thrift-border rounded-input"
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-thrift-text mb-2">Message to Seller (Optional)</label>
          <textarea
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            placeholder="Add a message..."
            className="w-full px-3 py-2 border border-thrift-border rounded-input resize-none h-24"
          />
        </div>
        <Button className="w-full" onClick={() => setShowOfferModal(false)}>
          Send Offer
        </Button>
      </Modal>
    </div>
  );
}
