import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Grid, List, ChevronDown, MapPin, Star, Package } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ListingCard } from '../components/cards/ListingCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { categoryLabels } from '../data/mockData';
import { listingsApi } from '../lib/api';
import { toListing } from '../lib/mappers';
import type { Category, Condition, Listing } from '../types';

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filters, setFilters] = useState<{
    search: string;
    categories: Category[];
    conditions: Condition[];
    minPrice: number;
    maxPrice: number;
    location: string;
    delivery: string[];
    minRating: number;
    listedWithin: string;
  }>({
    search: searchParams.get('q') || '',
    categories: [],
    conditions: [],
    minPrice: 0,
    maxPrice: 50000,
    location: '',
    delivery: [],
    minRating: 0,
    listedWithin: 'all',
  });

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'nearest', label: 'Nearest' },
  ];

  const locations = ['All Locations', 'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar'];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsLoading(true);
      listingsApi.browse({
        search: filters.search || undefined,
        category: filters.categories[0],
        condition: filters.conditions[0],
        minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice < 50000 ? filters.maxPrice : undefined,
        location: filters.location && filters.location !== 'All Locations' ? filters.location : undefined,
        sort: sortOrder,
        limit: 48,
      }).then((res) => {
        setListings(res.data.listings.map(toListing));
        setTotalCount(res.data.total);
      }).catch(() => {
        setListings([]);
        setTotalCount(0);
      }).finally(() => setIsLoading(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, sortOrder]);

  const handleCategoryToggle = (category: Category) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleConditionToggle = (condition: Condition) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      conditions: [],
      minPrice: 0,
      maxPrice: 50000,
      location: '',
      delivery: [],
      minRating: 0,
      listedWithin: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'lg:block hidden'}`}>
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-thrift-text">Filters</h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-thrift-primary hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <Input
                  placeholder="Search..."
                  icon={<Search className="w-4 h-4" />}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <button className="flex items-center justify-between w-full mb-3" onClick={() => {}}>
                  <h3 className="text-sm font-medium text-thrift-text">Categories</h3>
                  <ChevronDown className="w-4 h-4 text-thrift-text-secondary" />
                </button>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(key as Category)}
                        onChange={() => handleCategoryToggle(key as Category)}
                        className="w-4 h-4 rounded border-thrift-border text-thrift-primary focus:ring-thrift-primary/20"
                      />
                      <span className="text-sm text-thrift-text-secondary">{label}</span>
                      <span className="ml-auto text-xs text-thrift-text-secondary">
                        {listings.filter((l) => l.category === key).length || ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-thrift-text mb-3">Condition</h3>
                <div className="space-y-2">
                  {['brand-new', 'like-new', 'good', 'fair', 'for-parts'].map((condition) => (
                    <label key={condition} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.conditions.includes(condition as Condition)}
                        onChange={() => handleConditionToggle(condition as Condition)}
                        className="w-4 h-4 rounded border-thrift-border text-thrift-primary focus:ring-thrift-primary/20"
                      />
                      <span className="text-sm text-thrift-text-secondary capitalize">
                        {condition.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-thrift-text mb-3">Price Range</h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={50000}
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    className="w-full h-2 bg-thrift-border rounded-lg appearance-none cursor-pointer accent-thrift-primary"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                      className="w-full px-2 py-1 text-sm bg-thrift-bg border border-thrift-border rounded-input"
                    />
                    <span className="text-thrift-text-secondary">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                      className="w-full px-2 py-1 text-sm bg-thrift-bg border border-thrift-border rounded-input"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-thrift-text mb-3">Location</h3>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-thrift-bg border border-thrift-border rounded-input"
                >
                  <option value="">All Locations</option>
                  {locations.filter(l => l !== 'All Locations').map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Seller Rating */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-thrift-text mb-3">Seller Rating</h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        filters.minRating >= rating
                          ? 'bg-thrift-warning/10 text-thrift-warning'
                          : 'bg-thrift-bg text-thrift-text-secondary hover:bg-thrift-border'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${filters.minRating >= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => {}} className="w-full">
                Apply Filters
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-4 bg-thrift-surface border border-thrift-border rounded-card p-3">
              <p className="text-sm text-thrift-text-secondary">
                <span className="font-medium text-thrift-text">{totalCount}</span> items found
              </p>
              <div className="flex items-center gap-4">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 text-sm bg-thrift-bg border border-thrift-border rounded-input"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 border border-thrift-border rounded-input p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-thrift-primary text-white' : 'text-thrift-text-secondary hover:bg-thrift-border'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-thrift-primary text-white' : 'text-thrift-text-secondary hover:bg-thrift-border'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Listings */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {[...Array(9)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="w-20 h-20 text-thrift-border mb-4" />
                <h3 className="text-lg font-medium text-thrift-text mb-2">No items found</h3>
                <p className="text-thrift-text-secondary mb-4">Try adjusting your filters</p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {listings.map((listing) =>
                  viewMode === 'grid' ? (
                    <ListingCard key={listing.id} listing={listing} />
                  ) : (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="flex gap-4 p-4 bg-thrift-surface border border-thrift-border rounded-card hover:shadow-lift transition-all"
                    >
                      <img
                        src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"}
                        alt={listing.title}
                        className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-thrift-text">{listing.title}</h3>
                        <p className="text-lg font-semibold text-thrift-primary mt-1">
                          NPR {listing.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-thrift-text-secondary">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-thrift-warning text-thrift-warning" />
                            {listing.rating}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}

            {/* Pagination */}
            {listings.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm">Previous</Button>
                <div className="flex gap-1">
                  {[1, 2, 3, '...', 10].map((page, i) => (
                    <button
                      key={i}
                      className={`w-8 h-8 rounded-input text-sm ${
                        page === 1
                          ? 'bg-thrift-primary text-white'
                          : 'bg-thrift-surface border border-thrift-border text-thrift-text-secondary hover:bg-thrift-border'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
