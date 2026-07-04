import { Link } from 'react-router-dom';
import {
  Leaf,
  Shield,
  Star,
  CheckCircle,
  Truck,
  Lock,
  CreditCard,
  Camera,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ListingCard } from '../components/cards/ListingCard';
import { Badge } from '../components/ui/Badge';
import { categoryLabels } from '../data/mockData';
import { listingsApi } from '../lib/api';
import { toListing } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import type { Category, Listing } from '../types';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const sellerStartPath = isAuthenticated
    ? (user?.role === 'seller' || user?.role === 'both' ? '/listings/new' : '/dashboard/buyer')
    : '/register?role=seller';

  const { data: allListingsData } = useApi(() =>
    listingsApi.browse({ limit: 12, sort: 'newest' }).then((r) => r.data.listings.map(toListing)),
  );
  const allListings: Listing[] = allListingsData ?? [];
  const heroListings = allListings.slice(0, 3);
  const featuredListings = selectedCategory === 'all'
    ? allListings.slice(0, 8)
    : allListings.filter((l) => l.category === selectedCategory).slice(0, 8);

  const categories: {
    value: 'all' | Category;
    label: string;
    icon?: React.ReactNode;
  }[] = [
    { value: 'all', label: 'All' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'books', label: 'Books' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'sports', label: 'Sports' },
    { value: 'toys', label: 'Toys' },
    { value: 'art', label: 'Art' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'appliances', label: 'Appliances' },
  ];

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="paper-texture py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-in">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-thrift-primary/10 text-thrift-primary text-sm font-medium rounded-full mb-6">
                <Leaf className="w-4 h-4" />
                Sustainable Shopping
              </span>

              <h1 className="font-playfair text-3xl lg:text-5xl font-semibold text-thrift-text leading-tight mb-6">
                Give things a second life.
              </h1>

              <p className="text-lg text-thrift-text-secondary leading-relaxed mb-8 max-w-lg">
                Buy and sell pre-loved items in your community. Good for your wallet. Better for the planet.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  to={sellerStartPath}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-thrift-primary text-white font-medium rounded-btn hover:bg-thrift-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <TrendingUp className="w-4 h-4" />
                  Start Selling
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-thrift-secondary text-thrift-secondary font-medium rounded-btn hover:bg-thrift-secondary/5 transition-colors"
                >
                  Browse Listings
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-thrift-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-thrift-success" />
                  Secure Payments
                </span>
                <span className="text-thrift-border">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-thrift-success" />
                  Verified Sellers
                </span>
                <span className="text-thrift-border">·</span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-thrift-success" />
                  10,000+ Items Listed
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative h-[480px]">
                {heroListings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="absolute w-64 bg-thrift-surface border border-thrift-border rounded-card shadow-lift overflow-hidden"
                    style={{
                      top: index === 0 ? '0' : index === 1 ? '120px' : '220px',
                      left: index === 2 ? '0' : index === 1 ? '40px' : '80px',
                      transform: `rotate(${index === 0 ? '-3deg' : index === 1 ? '1deg' : '4deg'})`,
                      zIndex: 3 - index,
                    }}
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="success" size="sm">
                          {listing.condition === 'like-new' ? 'Like New' : listing.condition}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-thrift-text line-clamp-1">
                        {listing.title.length > 25 ? listing.title.slice(0, 25) + '...' : listing.title}
                      </h3>
                      <p className="text-lg font-semibold text-thrift-primary mt-1">
                        NPR {listing.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-thrift-warning fill-thrift-warning" />
                        <span className="text-xs text-thrift-text-secondary">
                          {listing.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="border-b border-thrift-border bg-thrift-surface sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-thrift-primary text-white'
                    : 'bg-thrift-bg text-thrift-text-secondary hover:bg-thrift-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text mb-8">
            Fresh Finds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((listing, index) => (
              <div
                key={listing.id}
                className="fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-thrift-primary font-medium hover:underline"
            >
              View all listings
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-thrift-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-12">
            How ThriftNest Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 border-t-2 border-dashed border-thrift-border" />

            <div className="relative text-center fade-in">
              <div className="w-16 h-16 rounded-full bg-thrift-primary/10 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-thrift-primary" />
              </div>
              <h3 className="text-lg font-semibold text-thrift-text mb-2">
                List your item
              </h3>
              <p className="text-thrift-text-secondary">
                Add photos, write a description, and set your price. It only takes a few minutes.
              </p>
            </div>

            <div className="relative text-center fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 rounded-full bg-thrift-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-thrift-primary" />
              </div>
              <h3 className="text-lg font-semibold text-thrift-text mb-2">
                Connect with buyers
              </h3>
              <p className="text-thrift-text-secondary">
                Chat with interested buyers, negotiate prices, and build trust through ratings.
              </p>
            </div>

            <div className="relative text-center fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 rounded-full bg-thrift-primary/10 flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-8 h-8 text-thrift-primary" />
              </div>
              <h3 className="text-lg font-semibold text-thrift-text mb-2">
                Get paid securely
              </h3>
              <p className="text-thrift-text-secondary">
                Receive payments via Stripe. Protected from fraud with our buyer protection policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 bg-thrift-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-12">
            Trust & Safety
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-thrift-surface rounded-card shadow-card">
              <div className="w-12 h-12 rounded-full bg-thrift-success/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-thrift-success" />
              </div>
              <h3 className="font-semibold text-thrift-text mb-2">Encrypted Payments</h3>
              <p className="text-sm text-thrift-text-secondary">
                All transactions secured with 256-bit SSL encryption
              </p>
            </div>

            <div className="text-center p-6 bg-thrift-surface rounded-card shadow-card">
              <div className="w-12 h-12 rounded-full bg-thrift-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-thrift-success" />
              </div>
              <h3 className="font-semibold text-thrift-text mb-2">Verified Profiles</h3>
              <p className="text-sm text-thrift-text-secondary">
                ID verification for all sellers to ensure trust
              </p>
            </div>

            <div className="text-center p-6 bg-thrift-surface rounded-card shadow-card">
              <div className="w-12 h-12 rounded-full bg-thrift-success/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-thrift-success" />
              </div>
              <h3 className="font-semibold text-thrift-text mb-2">Buyer Protection</h3>
              <p className="text-sm text-thrift-text-secondary">
                Full refund if item doesn't match description
              </p>
            </div>

            <div className="text-center p-6 bg-thrift-surface rounded-card shadow-card">
              <div className="w-12 h-12 rounded-full bg-thrift-success/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-thrift-success" />
              </div>
              <h3 className="font-semibold text-thrift-text mb-2">Seller Ratings</h3>
              <p className="text-sm text-thrift-text-secondary">
                Community-driven ratings for transparent reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-thrift-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-12">
            What Our Community Says
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-thrift-bg p-6 rounded-card border border-thrift-border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-thrift-warning fill-thrift-warning" />
                ))}
              </div>
              <p className="text-thrift-text-secondary mb-4 italic">
                "I saved over NPR 15,000 on a camera that works perfectly. The seller was honest about the condition and even threw in extra accessories!"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://picsum.photos/seed/hari/200/200"
                  alt="Hari"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-thrift-text">Hari Thapa</p>
                  <p className="text-sm text-thrift-text-secondary">Pokhara</p>
                </div>
              </div>
            </div>

            <div className="bg-thrift-bg p-6 rounded-card border border-thrift-border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-thrift-warning fill-thrift-warning" />
                ))}
              </div>
              <p className="text-thrift-text-secondary mb-4 italic">
                "As a seller, I've earned over NPR 50,000 selling items I no longer need. The platform makes it so easy to connect with genuine buyers."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://picsum.photos/seed/maya/200/200"
                  alt="Maya"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-thrift-text">Maya Tamang</p>
                  <p className="text-sm text-thrift-text-secondary">Bhaktapur</p>
                </div>
              </div>
            </div>

            <div className="bg-thrift-bg p-6 rounded-card border border-thrift-border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-thrift-warning fill-thrift-warning" />
                ))}
              </div>
              <p className="text-thrift-text-secondary mb-4 italic">
                "Found rare books I'd been searching for years! The community here is amazing - everyone is helpful and transactions are smooth."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://picsum.photos/seed/sita/200/200"
                  alt="Sita"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-thrift-text">Sita Maharjan</p>
                  <p className="text-sm text-thrift-text-secondary">Kathmandu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
