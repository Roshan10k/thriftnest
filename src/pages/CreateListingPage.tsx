import { useState } from 'react';
import { Upload, X, Image, Info, MapPin, Truck, Package, DollarSign, Check, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { DashboardNavbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { ListingCard } from '../components/cards/ListingCard';
import { conditionLabels, categoryLabels } from '../data/mockData';
import { listingsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Condition, Category } from '../types';

const sidebarSections = [
  {
    items: [
      { icon: <Package className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard/seller' },
    ],
  },
];

export function CreateListingPage() {
  const [formData, setFormData] = useState({
    title: '',
    category: '' as Category | '',
    subcategory: '',
    condition: '' as Condition | '',
    description: '',
    price: '',
    originalPrice: '',
    negotiable: true,
    city: '',
    pickupAvailable: true,
    deliveryAvailable: false,
    deliveryFee: '',
    images: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const conditions = Object.entries(conditionLabels).map(([value, label]) => ({ value, label }));
  const categories = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));

  const cities = [
    { value: '', label: 'Select city' },
    { value: 'Kathmandu', label: 'Kathmandu' },
    { value: 'Lalitpur', label: 'Lalitpur' },
    { value: 'Bhaktapur', label: 'Bhaktapur' },
    { value: 'Pokhara', label: 'Pokhara' },
  ];

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const available = 8 - formData.images.length;
    const toAdd = Array.from(files).slice(0, available);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...toAdd]);
    setFormData({ ...formData, images: [...formData.images, ...newPreviews] });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (asDraft: boolean = false) => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.city) newErrors.city = 'City is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setApiError('');
    setSubmitting(true);
    try {
      await listingsApi.create(
        {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          category: formData.category,
          condition: formData.condition,
          location: formData.city,
          negotiable: formData.negotiable,
          deliveryAvailable: formData.deliveryAvailable,
          pickupAvailable: formData.pickupAvailable,
          deliveryFee: formData.deliveryFee ? Number(formData.deliveryFee) : undefined,
          status: asDraft ? 'paused' : 'active',
        },
        imageFiles,
      );
      navigate('/listings');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create listing';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const previewListing = {
    id: 'preview',
    title: formData.title || 'Untitled Listing',
    description: formData.description || 'No description provided',
    price: Number(formData.price) || 0,
    originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
    category: formData.category || 'other',
    condition: formData.condition || 'good',
    images: formData.images.length > 0 ? formData.images : ['https://picsum.photos/seed/placeholder/800/600'],
    seller: authUser ?? { id: '', name: '', email: '', role: 'seller' as const, phone: '', location: '', memberSince: '', verified: false, rating: 0, reviewCount: 0, responseRate: 0, salesCount: 0, purchaseCount: 0 },
    location: formData.city || 'Kathmandu',
    listedAt: 'Just now',
    views: 0,
    status: 'active' as const,
    negotiable: formData.negotiable,
    deliveryAvailable: formData.deliveryAvailable,
    pickupAvailable: formData.pickupAvailable,
    rating: authUser?.rating ?? 0,
    reviewCount: authUser?.reviewCount ?? 0,
  };

  const user = { name: authUser?.name ?? 'Seller', avatar: authUser?.avatar, role: 'Seller' };

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Sidebar sections={sidebarSections} user={user} />
      <div className="ml-60">
        <DashboardNavbar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text">Create New Listing</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => handleSubmit(true)} loading={submitting} disabled={submitting}>
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmit(false)} loading={submitting} disabled={submitting}>
                {submitting ? 'Publishing…' : 'Publish Listing'}
              </Button>
            </div>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-thrift-error/10 border border-thrift-error/30 rounded-lg text-thrift-error text-sm">
              {apiError}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photos Upload */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Photos
                </h2>
                <p className="text-sm text-thrift-text-secondary mb-4">
                  Add up to 8 photos. First photo will be the cover.
                </p>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-thrift-primary text-white text-xs px-2 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-thrift-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.images.length < 8 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-thrift-border flex flex-col items-center justify-center cursor-pointer hover:border-thrift-primary transition-colors bg-thrift-bg">
                      <Upload className="w-6 h-6 text-thrift-text-secondary mb-2" />
                      <span className="text-xs text-thrift-text-secondary">Add photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>

                <p className="text-xs text-thrift-text-secondary">
                  JPG/PNG only. Max 5MB each.
                </p>
              </div>

              {/* Item Details */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4">Item Details</h2>

                <div className="space-y-4">
                  <Input
                    label="Title"
                    placeholder="e.g., Vintage Levi's Denim Jacket - Size M"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={errors.title}
                    hint={`${formData.title.length}/80 characters`}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-thrift-text mb-1.5">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                        className="w-full px-3 py-2.5 bg-thrift-bg border border-thrift-border rounded-input"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      {errors.category && <p className="mt-1.5 text-sm text-thrift-error">{errors.category}</p>}
                    </div>

                    <Input
                      label="Subcategory (Optional)"
                      placeholder="e.g., Jackets"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-thrift-text mb-3">Condition</label>
                    <div className="grid grid-cols-5 gap-2">
                      {conditions.map((cond) => (
                        <button
                          key={cond.value}
                          onClick={() => setFormData({ ...formData, condition: cond.value as Condition })}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.condition === cond.value
                              ? 'border-thrift-primary bg-thrift-primary/5'
                              : 'border-thrift-border hover:border-thrift-primary/50'
                          }`}
                        >
                          <span className="text-xl block mb-1">
                            {cond.value === 'brand-new' && '🌟'}
                            {cond.value === 'like-new' && '✨'}
                            {cond.value === 'good' && '👍'}
                            {cond.value === 'fair' && '👌'}
                            {cond.value === 'for-parts' && '🔧'}
                          </span>
                          <span className="text-xs">{cond.label}</span>
                        </button>
                      ))}
                    </div>
                    {errors.condition && <p className="mt-1.5 text-sm text-thrift-error">{errors.condition}</p>}
                  </div>

                  <Textarea
                    label="Description"
                    placeholder="Describe your item honestly. Good descriptions sell faster! Include details like size, wear, imperfections."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    error={errors.description}
                    characterCount
                    maxChars={1000}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4">Pricing</h2>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-thrift-text mb-1.5">Asking Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-thrift-text-secondary">NPR</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full pl-12 pr-4 py-2.5 bg-thrift-bg border border-thrift-border rounded-input"
                        />
                      </div>
                      {errors.price && <p className="mt-1.5 text-sm text-thrift-error">{errors.price}</p>}
                    </div>

                    <Input
                      label="Original Price (Optional)"
                      placeholder="Show savings to buyers"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      hint="Original retail price"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-thrift-text">Price Negotiable</p>
                      <p className="text-sm text-thrift-text-secondary">Allow buyers to make offers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-thrift-border peer-focus:ring-2 peer-focus:ring-thrift-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thrift-primary" />
                    </label>
                  </div>

                  <div className="p-3 bg-thrift-success/10 rounded-lg flex items-center gap-2">
                    <Info className="w-4 h-4 text-thrift-success" />
                    <p className="text-sm text-thrift-success">Suggested price range: NPR 800 - 1,200 for {formData.category || 'this category'} in {formData.city || 'your area'}</p>
                  </div>
                </div>
              </div>

              {/* Location & Delivery */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4">Location & Delivery</h2>

                <div className="space-y-4">
                  <Select
                    label="City/District"
                    options={cities}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    error={errors.city}
                  />

                  <div className="flex gap-6">
                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <p className="font-medium text-thrift-text">Pickup Available</p>
                        <p className="text-sm text-thrift-text-secondary">Free</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pickupAvailable}
                          onChange={(e) => setFormData({ ...formData, pickupAvailable: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-thrift-border peer-checked:bg-thrift-primary rounded-full peer" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <p className="font-medium text-thrift-text">Delivery Available</p>
                        <p className="text-sm text-thrift-text-secondary">Charge a delivery fee</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.deliveryAvailable}
                          onChange={(e) => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-thrift-border peer-checked:bg-thrift-primary rounded-full peer" />
                      </label>
                    </div>
                  </div>

                  {formData.deliveryAvailable && (
                    <div className="relative">
                      <Input
                        label="Delivery Fee"
                        placeholder="150"
                        value={formData.deliveryFee}
                        onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-thrift-surface border border-thrift-border rounded-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-thrift-text-secondary" />
                      <h3 className="font-medium text-thrift-text">Preview</h3>
                    </div>
                  </div>
                  <p className="text-xs text-thrift-text-secondary mb-4">How buyers will see your listing</p>
                  <div className="scale-[0.85] origin-top-left">
                    <ListingCard listing={previewListing} />
                  </div>
                </div>

                <div className="mt-4 bg-thrift-primary/5 border border-thrift-primary/20 rounded-card p-4">
                  <p className="text-sm text-thrift-primary font-medium">
                    ~240 buyers in {formData.city || 'Lalitpur'} browse {categoryLabels[formData.category as Category] || 'this category'} weekly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
