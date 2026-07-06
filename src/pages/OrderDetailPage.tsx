import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Package, CheckCircle, MapPin, Star, MessageCircle, Download, Shield } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/modals/Modal';
import { ordersApi, reviewsApi } from '../lib/api';
import { toOrder } from '../lib/mappers';
import { useApi } from '../hooks/useApi';
import type { OrderStatus } from '../types';

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  'payment-pending': { label: 'Payment Pending', variant: 'warning' },
  'payment-confirmed': { label: 'Payment Confirmed', variant: 'success' },
  shipped: { label: 'Shipped', variant: 'warning' },
  delivered: { label: 'Delivered', variant: 'success' },
  disputed: { label: 'Disputed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'neutral' },
};

const trackingSteps = [
  { id: 'confirmed', label: 'Order Confirmed', desc: 'Payment received and order placed', done: true },
  { id: 'processing', label: 'Processing', desc: 'Seller is preparing your item', done: true },
  { id: 'shipped', label: 'Shipped', desc: 'Item dispatched via courier', done: true },
  { id: 'out', label: 'Out for Delivery', desc: 'On its way to your address', done: false },
  { id: 'delivered', label: 'Delivered', desc: 'Item successfully delivered', done: false },
];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: order, loading, refetch } = useApi(
    () => ordersApi.getById(id!).then((r) => toOrder(r.data)),
    [id],
  );

  const [paying, setPaying] = useState(false);
  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      await ordersApi.updateStatus(order.id, { status: 'payment-confirmed' });
      await refetch();
    } catch { /* keep pending on failure */ }
    finally { setPaying(false); }
  };

  const handleSubmitReview = async () => {
    if (!order || rating === 0 || !reviewText.trim()) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.create({ orderId: order.id, rating, comment: reviewText });
      setReviewSubmitted(true);
      setShowReviewModal(false);
    } catch { /* ignore */ } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-thrift-bg"><Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center text-thrift-text-secondary">Loading order…</main>
        <Footer />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen bg-thrift-bg"><Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center text-thrift-text-secondary">Order not found.</main>
        <Footer />
      </div>
    );
  }

  const cfg = statusConfig[order.status];

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-thrift-text-secondary hover:text-thrift-text mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text">
              Order Details
            </h1>
            <p className="text-thrift-text-secondary text-sm mt-1">#{order.id} · {order.createdAt}</p>
          </div>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>

        {/* Item */}
        <div className="bg-thrift-surface border border-thrift-border rounded-card p-5 mb-4">
          <div className="flex gap-4">
            <img
              src={order.listing.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
              alt={order.listing.title}
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h2 className="font-medium text-thrift-text">{order.listing.title}</h2>
              <p className="text-sm text-thrift-text-secondary capitalize mt-0.5">
                Condition: {order.listing.condition.replace('-', ' ')}
              </p>
              <p className="text-lg font-semibold text-thrift-primary mt-2">
                NPR {order.listing.price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="border-t border-thrift-border mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-thrift-text-secondary">
              <span>Item price</span>
              <span>NPR {order.listing.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-thrift-text-secondary">
              <span>Platform fee</span>
              <span>NPR {order.platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-thrift-text-secondary">
              <span>Delivery fee</span>
              <span>NPR {order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-thrift-border pt-2">
              <span className="text-thrift-text">Total Paid</span>
              <span className="text-thrift-primary">NPR {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tracking */}
        {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'payment-confirmed') && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-5 mb-4">
            <h2 className="font-semibold text-thrift-text mb-5 flex items-center gap-2">
              <Truck className="w-5 h-5 text-thrift-primary" />
              Order Tracking
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-thrift-border" />
              <div className="space-y-6">
                {trackingSteps.map((step, idx) => (
                  <div key={step.id} className="relative flex gap-4 pl-10">
                    <div
                      className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        step.done
                          ? 'bg-thrift-primary text-white'
                          : idx === trackingSteps.findIndex((s) => !s.done)
                          ? 'bg-thrift-warning/20 border-2 border-thrift-warning text-thrift-warning'
                          : 'bg-thrift-border text-thrift-text-secondary'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${step.done ? 'text-thrift-text' : 'text-thrift-text-secondary'}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-thrift-text-secondary">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-thrift-surface border border-thrift-border rounded-card p-5 mb-4">
          <h2 className="font-semibold text-thrift-text mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-thrift-primary" />
            Delivery Address
          </h2>
          <p className="text-thrift-text">{order.deliveryAddress.fullName}</p>
          <p className="text-thrift-text-secondary text-sm">{order.deliveryAddress.phone}</p>
          <p className="text-thrift-text-secondary text-sm">
            {order.deliveryAddress.street}, {order.deliveryAddress.city}
          </p>
          <p className="text-thrift-text-secondary text-sm">
            {order.deliveryAddress.district} {order.deliveryAddress.postalCode}
          </p>
        </div>

        {/* Seller */}
        <div className="bg-thrift-surface border border-thrift-border rounded-card p-5 mb-4">
          <h2 className="font-semibold text-thrift-text mb-3">Seller</h2>
          <div className="flex items-center gap-3">
            <img src={order.seller.avatar} alt={order.seller.name} className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-medium text-thrift-text">{order.seller.name}</p>
              <div className="flex items-center gap-1 text-sm text-thrift-text-secondary">
                <Star className="w-3 h-3 fill-thrift-warning text-thrift-warning" />
                {order.seller.rating} · {order.seller.reviewCount} reviews
              </div>
            </div>
            <Link to="/messages" className="ml-auto">
              <Button variant="outline" size="sm" icon={<MessageCircle className="w-4 h-4" />}>
                Message
              </Button>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {order.status === 'payment-pending' && (
            <Button loading={paying} onClick={handlePay}>
              {paying ? 'Processing…' : `Complete Payment · NPR ${order.totalAmount.toLocaleString()}`}
            </Button>
          )}
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Download Receipt
          </Button>
          {order.status === 'delivered' && !reviewSubmitted && (
            <Button
              icon={<Star className="w-4 h-4" />}
              onClick={() => setShowReviewModal(true)}
            >
              Leave a Review
            </Button>
          )}
          {reviewSubmitted && (
            <div className="flex items-center gap-2 text-thrift-success text-sm">
              <CheckCircle className="w-4 h-4" />
              Review submitted — thank you!
            </div>
          )}
          {['payment-pending', 'payment-confirmed', 'shipped'].includes(order.status) && (
            <Button variant="outline" className="text-thrift-error border-thrift-error hover:bg-thrift-error/5">
              <Shield className="w-4 h-4 mr-2" />
              Open Dispute
            </Button>
          )}
        </div>
      </main>

      <Footer />

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Leave a Review">
        <div className="mb-4">
          <p className="text-sm text-thrift-text-secondary mb-1">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}>
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= rating ? 'text-thrift-warning fill-thrift-warning' : 'text-thrift-border'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-thrift-text mb-1.5">Comment</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell others about your experience…"
            className="w-full px-3 py-2 border border-thrift-border rounded-input resize-none h-24 text-sm"
          />
        </div>
        <Button
          className="w-full"
          disabled={rating === 0 || !reviewText.trim()}
          onClick={handleSubmitReview}
          loading={submittingReview}
        >
          {submittingReview ? 'Submitting…' : 'Submit Review'}
        </Button>
      </Modal>
    </div>
  );
}
