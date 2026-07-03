import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, MessageCircle } from 'lucide-react';
import type { Listing } from '../../types';
import { Badge } from '../ui/Badge';
import { useState } from 'react';
import { conditionLabels } from '../../data/mockData';

interface ListingCardProps {
  listing: Listing;
  variant?: 'default' | 'compact';
}

export function ListingCard({ listing, variant = 'default' }: ListingCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const conditionVariant = {
    'brand-new': 'success' as const,
    'like-new': 'success' as const,
    good: 'warning' as const,
    fair: 'neutral' as const,
    'for-parts': 'error' as const,
  };

  const savings = listing.originalPrice
    ? listing.originalPrice - listing.price
    : 0;

  const savingsPercent = listing.originalPrice
    ? Math.round((savings / listing.originalPrice) * 100)
    : 0;

  if (variant === 'compact') {
    return (
      <Link to={`/listings/${listing.id}`} className="flex gap-3 group">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-thrift-text line-clamp-2 group-hover:text-thrift-primary transition-colors">
            {listing.title}
          </h4>
          <p className="text-lg font-semibold text-thrift-primary mt-1">
            NPR {listing.price.toLocaleString()}
          </p>
          <p className="text-xs text-thrift-text-secondary mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.location}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group bg-thrift-surface border border-thrift-border rounded-card overflow-hidden shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-3 left-3">
          <Badge variant={conditionVariant[listing.condition]} size="sm">
            {conditionLabels[listing.condition]}
          </Badge>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isWishlisted
              ? 'bg-thrift-error text-white'
              : 'bg-thrift-surface/80 backdrop-blur-sm text-thrift-text-secondary hover:text-thrift-error'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-base font-medium text-thrift-text line-clamp-2 group-hover:text-thrift-primary transition-colors">
          {listing.title}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-semibold text-thrift-primary">
            NPR {listing.price.toLocaleString()}
          </span>
          {listing.originalPrice && (
            <>
              <span className="text-sm text-thrift-text-secondary line-through">
                NPR {listing.originalPrice.toLocaleString()}
              </span>
              <span className="text-xs text-thrift-success font-medium">
                {savingsPercent}% off
              </span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <img
            src={listing.seller.avatar}
            alt={listing.seller.name}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-xs text-thrift-text-secondary">{listing.seller.name}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-thrift-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {listing.listedAt}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <div className="flex items-center text-thrift-warning">
            {'★'}
          </div>
          <span className="text-xs text-thrift-text">
            {listing.rating}
          </span>
          <span className="text-xs text-thrift-text-secondary">
            ({listing.reviewCount} reviews)
          </span>
        </div>

        {listing.negotiable && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-thrift-secondary">
            <MessageCircle className="w-3 h-3" />
            Price negotiable
          </div>
        )}
      </div>
    </Link>
  );
}
