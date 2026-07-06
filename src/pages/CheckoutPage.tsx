import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, Truck, MapPin, Shield, Clock } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { listingsApi, ordersApi } from '../lib/api';
import { toListing } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

type Step = 1 | 2 | 3 | 4;

export function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    deliveryMethod: 'standard' as 'standard' | 'express' | 'pickup',
    address: {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      district: '',
      postalCode: '',
    },
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const { data: listing, loading: listingLoading } = useApi(
    () => listingsApi.getById(id!).then((r) => toListing(r.data)),
    [id],
  );

  if (listingLoading || !listing) {
    return (
      <div className="min-h-screen bg-thrift-bg flex items-center justify-center">
        <p className="text-thrift-text-secondary">{listingLoading ? 'Loading…' : 'Listing not found.'}</p>
      </div>
    );
  }

  const deliveryOptions = [
    { value: 'standard', label: 'Standard (3-5 days)', price: 150, icon: <Truck className="w-5 h-5" /> },
    { value: 'express', label: 'Express (1-2 days)', price: 350, icon: <Clock className="w-5 h-5" /> },
    { value: 'pickup', label: 'Pickup (free)', price: 0, icon: <MapPin className="w-5 h-5" /> },
  ];

  const platformFee = Math.round(listing.price * 0.05);
  const deliveryFee = formData.deliveryMethod === 'express' ? 350 : formData.deliveryMethod === 'standard' ? 150 : 0;
  const total = listing.price + platformFee + deliveryFee;

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-6">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Review' },
            { num: 2, label: 'Delivery' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'Confirm' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.num ? 'bg-thrift-primary text-white' : 'bg-thrift-border text-thrift-text-secondary'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`hidden md:block ml-2 text-sm ${step >= s.num ? 'text-thrift-text' : 'text-thrift-text-secondary'}`}>
                {s.label}
              </span>
              {idx < 3 && (
                <div className={`hidden md:block w-24 h-px mx-4 ${step > s.num ? 'bg-thrift-primary' : 'bg-thrift-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 fade-in">
                <h2 className="font-semibold text-thrift-text mb-4">Review Your Order</h2>

                <div className="flex gap-4 p-4 bg-thrift-bg rounded-lg mb-6">
                  <img src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"} alt={listing.title} className="w-24 h-24 rounded object-cover" />
                  <div>
                    <p className="font-medium text-thrift-text">{listing.title}</p>
                    <p className="text-sm text-thrift-text-secondary capitalize">{listing.condition.replace('-', ' ')}</p>
                    <p className="text-lg font-semibold text-thrift-primary mt-2">NPR {listing.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-thrift-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-thrift-text-secondary">Item price</span>
                    <span className="text-thrift-text">NPR {listing.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-thrift-text-secondary">Platform fee (5%)</span>
                    <span className="text-thrift-text">NPR {platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-thrift-text-secondary">Delivery fee</span>
                    <span className="text-thrift-text">NPR {deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-thrift-border font-semibold">
                    <span className="text-thrift-text">Total</span>
                    <span className="text-thrift-primary">NPR {total.toLocaleString()}</span>
                  </div>
                </div>

                <Button className="w-full mt-6" onClick={() => setStep(2)}>
                  Proceed to Delivery
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 fade-in">
                <h2 className="font-semibold text-thrift-text mb-4">Delivery Details</h2>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-thrift-error/10 border border-thrift-error/30 text-sm text-thrift-error">
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <Input label="Full Name" value={formData.address.fullName} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, fullName: e.target.value } })} />
                  <Input label="Phone" value={formData.address.phone} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, phone: e.target.value } })} />
                  <Input label="Street Address" className="sm:col-span-2" value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} />
                  <Select
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    options={[
                      { value: '', label: 'Select city' },
                      { value: 'Kathmandu', label: 'Kathmandu' },
                      { value: 'Lalitpur', label: 'Lalitpur' },
                      { value: 'Bhaktapur', label: 'Bhaktapur' },
                      { value: 'Pokhara', label: 'Pokhara' },
                    ]}
                  />
                  <Input label="District" value={formData.address.district} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })} />
                  <Input label="Postal Code" value={formData.address.postalCode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })} />
                </div>

                <h3 className="font-medium text-thrift-text mb-4">Delivery Method</h3>
                <div className="space-y-3 mb-6">
                  {deliveryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, deliveryMethod: opt.value as 'standard' | 'express' | 'pickup' })}
                      className={`w-full p-4 flex items-center justify-between rounded-lg border-2 transition-all ${
                        formData.deliveryMethod === opt.value ? 'border-thrift-primary bg-thrift-primary/5' : 'border-thrift-border hover:border-thrift-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formData.deliveryMethod === opt.value ? 'bg-thrift-primary text-white' : 'bg-thrift-bg text-thrift-text-secondary'}`}>
                          {opt.icon}
                        </div>
                        <span className="font-medium text-thrift-text">{opt.label}</span>
                      </div>
                      <span className="text-thrift-primary font-semibold">{opt.price === 0 ? 'Free' : `NPR ${opt.price}`}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const a = formData.address;
                      if (a.fullName.trim().length < 2) return setError('Please enter your full name.');
                      if (a.phone.trim().length < 10) return setError('Please enter a valid phone number (at least 10 digits).');
                      if (a.street.trim().length < 3) return setError('Please enter your street address.');
                      if (a.city.trim().length < 2) return setError('Please select your city.');
                      if (a.district.trim().length < 2) return setError('Please enter your district.');
                      if (a.postalCode.trim().length < 4) return setError('Please enter a valid postal code.');
                      setError(null);
                      setStep(3);
                    }}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 fade-in">
                <h2 className="font-semibold text-thrift-text mb-4">Payment</h2>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-thrift-error/10 border border-thrift-error/30 text-sm text-thrift-error">
                    {error}
                  </div>
                )}

                <div className="p-4 bg-thrift-bg rounded-lg mb-6">
                  <div className="space-y-3">
                    <Input label="Card Number" placeholder="4242 4242 4242 4242" value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Expiry Date" placeholder="MM/YY" value={formData.cardExpiry} onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })} />
                      <Input label="CVC" placeholder="123" value={formData.cardCvc} onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  <button className="p-3 bg-orange-500 text-white rounded-btn font-medium flex items-center justify-center gap-2">eSewa</button>
                  <button className="p-3 bg-purple-600 text-white rounded-btn font-medium flex items-center justify-center gap-2">Khalti</button>
                </div>

                <div className="flex items-center gap-2 p-3 bg-thrift-success/10 rounded-lg mb-6">
                  <Shield className="w-4 h-4 text-thrift-success" />
                  <p className="text-sm text-thrift-success">Your payment is encrypted and secure</p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button
                    className="flex-1"
                    loading={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setError(null);
                      try {
                        const order = await ordersApi.create({
                          listingId: listing.id,
                          deliveryMethod: formData.deliveryMethod,
                          deliveryAddress: formData.address,
                          paymentMethod: 'stripe',
                        });
                        const orderId = String((order.data as Record<string, unknown>).id ?? '');
                        setStep(4);
                        if (orderId) navigate(`/orders/${orderId}`);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Could not place your order. Please try again.');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {submitting ? 'Processing…' : `Pay NPR ${total.toLocaleString()}`}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-thrift-surface border border-thrift-border rounded-card p-8 text-center fade-in">
                <div className="w-16 h-16 rounded-full bg-thrift-success flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">Order Confirmed!</h2>
                <p className="text-thrift-text-secondary mb-6">Thank you for shopping with ThriftNest</p>
                <p className="text-sm font-mono bg-thrift-bg inline-block px-3 py-1 rounded mb-6">Order #TN-2024-00847</p>
                <div className="flex gap-4 justify-center">
                  <Link to="/orders"><Button>Track Your Order</Button></Link>
                  <Link to="/browse"><Button variant="outline">Continue Shopping</Button></Link>
                </div>
                {authUser?.email && (
                  <p className="text-sm text-thrift-text-secondary mt-6">A receipt has been sent to {authUser.email}</p>
                )}
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-thrift-surface border border-thrift-border rounded-card p-4 sticky top-24">
              <h3 className="font-semibold text-thrift-text mb-4">Order Summary</h3>
              <div className="flex gap-3 mb-4">
                <img src={listing.images?.[0] ?? "https://placehold.co/400x300?text=No+Image"} alt="" className="w-16 h-16 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-thrift-text line-clamp-2">{listing.title}</p>
                  <p className="text-sm text-thrift-primary font-semibold">NPR {listing.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t border-thrift-border pt-4">
                <div className="flex justify-between text-thrift-text-secondary">
                  <span>Subtotal</span>
                  <span>NPR {listing.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-thrift-text-secondary">
                  <span>Platform fee</span>
                  <span>NPR {platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-thrift-text-secondary">
                  <span>Delivery</span>
                  <span>NPR {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-thrift-border pt-2">
                  <span className="text-thrift-text">Total</span>
                  <span className="text-thrift-primary">NPR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
