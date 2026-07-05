import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Image, Info, MapPin, Truck, Package, DollarSign, Eye, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { DashboardNavbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { Modal } from '../components/modals/Modal';
import { ListingCard } from '../components/cards/ListingCard';
import { conditionLabels, categoryLabels } from '../data/mockData';
import { listingsApi } from '../lib/api';
import { toListing } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import type { Condition, Category } from '../types';

const sidebarSections = [
  {
    items: [
      { icon: <Package className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard/seller' },
    ],
  },
];

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const { data: existing, loading: loadingListing } = useApi(
    () => listingsApi.getById(id!).then((r) => toListing(r.data)),
    [id],
  );

  const [formData, setFormData] = useState({
    title: '',
    category: 'other' as Category,
    condition: 'good' as Condition,
    description: '',
    price: '',
    originalPrice: '',
    negotiable: false,
    city: '',
    pickupAvailable: true,
    deliveryAvailable: false,
    deliveryFee: '',
    images: [] as string[],
  });

  // Populate form once listing loads
  const [initialized, setInitialized] = useState(false);
  if (existing && !initialized) {
    setFormData({
      title: existing.title,
      category: existing.category,
      condition: existing.condition,
      description: existing.description,
      price: String(existing.price),
      originalPrice: existing.originalPrice ? String(existing.originalPrice) : '',
      negotiable: existing.negotiable,
      city: existing.location,
      pickupAvailable: existing.pickupAvailable,
      deliveryAvailable: existing.deliveryAvailable,
      deliveryFee: existing.deliveryFee ? String(existing.deliveryFee) : '',
      images: existing.images,
    });
    setInitialized(true);
  }

  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const conditions = Object.entries(conditionLabels).map(([value, label]) => ({ value, label }));
  const categories = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));
  const cities = [
    { value: '', label: 'Select city' },
    { value: 'Kathmandu', label: 'Kathmandu' },
    { value: 'Lalitpur', label: 'Lalitpur' },
    { value: 'Bhaktapur', label: 'Bhaktapur' },
    { value: 'Pokhara', label: 'Pokhara' },
  ];

  if (loadingListing) {
    return (
      <div className="min-h-screen bg-thrift-bg flex items-center justify-center">
        <p className="text-thrift-text-secondary">Loading listing…</p>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const available = 8 - formData.images.length;
    const toAdd = Array.from(files).slice(0, available);
    const previews = toAdd.map((f) => URL.createObjectURL(f));
    setNewImageFiles((prev) => [...prev, ...toAdd]);
    setFormData({ ...formData, images: [...formData.images, ...previews] });
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleSave = async (asDraft = false) => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price) newErrors.price = 'Price is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSubmitting(true);
    try {
      await listingsApi.update(id!, {
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
      }, newImageFiles);
      setSaved(true);
      setTimeout(() => navigate('/dashboard/seller'), 1200);
    } catch { /* stay on page */ } finally {
      setSubmitting(false);
    }
  };

  const previewListing = {
    id: existing?.id ?? 'preview',
    title: formData.title || 'Untitled',
    description: formData.description,
    price: Number(formData.price) || 0,
    originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
    category: formData.category || 'other',
    condition: formData.condition || 'good',
    images: formData.images.length > 0 ? formData.images : ['https://picsum.photos/seed/placeholder/800/600'],
    seller: authUser ?? existing?.seller ?? { id: '', name: '', email: '', role: 'seller' as const, phone: '', location: '', memberSince: '', verified: false, rating: 0, reviewCount: 0, responseRate: 0, salesCount: 0, purchaseCount: 0 },
    location: formData.city || (existing?.location ?? ''),
    listedAt: existing?.listedAt ?? '',
    views: existing?.views ?? 0,
    status: 'active' as const,
    negotiable: formData.negotiable,
    deliveryAvailable: formData.deliveryAvailable,
    pickupAvailable: formData.pickupAvailable,
    rating: existing.rating,
    reviewCount: existing.reviewCount,
  };

  const user = { name: 'Roshan Sharma', avatar: 'https://picsum.photos/seed/roshan/200/200', role: 'Seller' };

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Sidebar sections={sidebarSections} user={user} />
      <div className="ml-60">
        <DashboardNavbar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/seller"
                className="p-2 text-thrift-text-secondary hover:text-thrift-text transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-playfair text-xl font-semibold text-thrift-text">Edit Listing</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="success" size="sm">Active</Badge>
                  <span className="text-xs text-thrift-text-secondary">{existing.views} views</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="text-thrift-error border-thrift-error hover:bg-thrift-error/5"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
              <Button variant="outline" onClick={() => handleSave(true)} disabled={submitting}>Save as Draft</Button>
              <Button onClick={() => handleSave(false)} loading={submitting || saved} disabled={submitting}>
                {saved ? 'Saved!' : submitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Photos */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Photos
                </h2>
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
                      <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4">Item Details</h2>
                <div className="space-y-4">
                  <Input
                    label="Title"
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
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-thrift-text mb-1.5">Condition</label>
                      <select
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                        className="w-full px-3 py-2.5 bg-thrift-bg border border-thrift-border rounded-input"
                      >
                        {conditions.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Textarea
                    label="Description"
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
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-thrift-text mb-1.5">Asking Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-thrift-text-secondary">NPR</span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-12 pr-4 py-2.5 bg-thrift-bg border border-thrift-border rounded-input"
                      />
                    </div>
                    {errors.price && <p className="mt-1.5 text-sm text-thrift-error">{errors.price}</p>}
                  </div>
                  <Input
                    label="Original Price (Optional)"
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
                    <div className="w-11 h-6 bg-thrift-border rounded-full peer peer-checked:bg-thrift-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              </div>

              {/* Location */}
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                <h2 className="font-semibold text-thrift-text mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location & Delivery
                </h2>
                <div className="space-y-4">
                  <Select
                    label="City/District"
                    options={cities}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-thrift-text">Delivery Available</p>
                      <p className="text-sm text-thrift-text-secondary">Offer to ship the item</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.deliveryAvailable}
                        onChange={(e) => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-thrift-border rounded-full peer peer-checked:bg-thrift-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                  </div>
                  {formData.deliveryAvailable && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-thrift-text-secondary text-sm">
                        <Truck className="w-4 h-4" />
                      </span>
                      <Input
                        label="Delivery Fee (NPR)"
                        value={formData.deliveryFee}
                        onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                        placeholder="e.g. 150"
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
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-thrift-text-secondary" />
                    <h3 className="font-medium text-thrift-text text-sm">Live Preview</h3>
                  </div>
                  <div className="scale-[0.85] origin-top-left">
                    <ListingCard listing={previewListing} />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-thrift-bg border border-thrift-border rounded-card text-sm text-thrift-text-secondary">
                  <p className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-thrift-primary flex-shrink-0" />
                    Changes are visible to buyers immediately after saving.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Listing">
        <p className="text-thrift-text-secondary mb-6">
          Are you sure you want to permanently delete <strong>{existing.title}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              try { await listingsApi.delete(id!); } catch { /* ignore */ }
              setShowDeleteModal(false);
              navigate('/dashboard/seller');
            }}
          >
            Delete Listing
          </Button>
        </div>
      </Modal>
    </div>
  );
}
