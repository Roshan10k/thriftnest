import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, MessageCircle, Mail, Shield, ShoppingCart, Package, CreditCard } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const categories = [
  { icon: <ShoppingCart className="w-5 h-5" />, label: 'Buying', color: 'bg-thrift-primary/10 text-thrift-primary' },
  { icon: <Package className="w-5 h-5" />, label: 'Selling', color: 'bg-thrift-secondary/10 text-thrift-secondary' },
  { icon: <CreditCard className="w-5 h-5" />, label: 'Payments', color: 'bg-thrift-success/10 text-thrift-success' },
  { icon: <Shield className="w-5 h-5" />, label: 'Safety & Security', color: 'bg-thrift-warning/10 text-thrift-warning' },
];

const faqs: { q: string; a: string; category: string }[] = [
  {
    q: 'How do I buy an item?',
    a: 'Browse listings, click on an item you like, then click "Buy Now". You\'ll go through a checkout process where you enter your delivery address and payment details. Payment is processed securely through Stripe or via eSewa/Khalti.',
    category: 'Buying',
  },
  {
    q: 'Is my payment safe?',
    a: 'Yes. All payments are processed by Stripe, a PCI-DSS compliant payment provider. Your card data never touches our servers. For Nepali users, eSewa and Khalti are also supported.',
    category: 'Payments',
  },
  {
    q: 'How do I list an item for sale?',
    a: 'Go to your Seller Dashboard and click "New Listing". Add photos, a title, description, category, condition and price. Listings go live immediately once published.',
    category: 'Selling',
  },
  {
    q: 'What is the platform fee?',
    a: 'ThriftNest charges a 5% platform fee on each completed sale. This covers secure payment processing, buyer protection, and platform maintenance.',
    category: 'Payments',
  },
  {
    q: 'What is Buyer Protection?',
    a: 'If an item arrives significantly different from its description, you can open a dispute within 3 days of delivery. We will mediate and, if the claim is valid, issue a full refund.',
    category: 'Buying',
  },
  {
    q: 'How do I set up Two-Factor Authentication?',
    a: 'During registration you are prompted to set up TOTP-based 2FA using Google Authenticator or Authy. You can also enable or regenerate it from Settings → Security at any time.',
    category: 'Safety & Security',
  },
  {
    q: 'My account has been locked. What do I do?',
    a: 'Accounts are temporarily locked after 5 failed login attempts for 15 minutes. If you believe your account has been compromised, reset your password immediately via the "Forgot password" link.',
    category: 'Safety & Security',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to My Orders and click "Track" on any shipped order. The tracking page shows real-time status from confirmed → processing → shipped → out for delivery → delivered.',
    category: 'Buying',
  },
  {
    q: 'Can I negotiate the price?',
    a: 'If the seller has marked their listing as "Price Negotiable", you can message them or use the "Make Offer" button on the listing page to propose a price.',
    category: 'Buying',
  },
  {
    q: 'How do I report a suspicious listing or user?',
    a: 'On any listing page or user profile, scroll to the bottom and click "Report". Our moderation team reviews all reports within 24 hours.',
    category: 'Safety & Security',
  },
];

export function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = faqs.filter((f) => {
    const matchSearch =
      !search ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      {/* Header */}
      <section className="py-12 bg-thrift-surface border-b border-thrift-border">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="font-playfair text-3xl font-semibold text-thrift-text mb-3">
            How can we help?
          </h1>
          <p className="text-thrift-text-secondary mb-6">
            Search our help center or browse topics below
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-thrift-text-secondary" />
            <input
              type="text"
              placeholder="Search for answers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-thrift-bg border border-thrift-border rounded-card text-thrift-text shadow-card"
            />
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-card border-2 transition-all ${
                activeCategory === cat.label
                  ? 'border-thrift-primary bg-thrift-primary/5'
                  : 'border-thrift-border bg-thrift-surface hover:border-thrift-primary/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                {cat.icon}
              </div>
              <span className="text-sm font-medium text-thrift-text">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <h2 className="font-semibold text-thrift-text mb-4">
          {activeCategory ? `${activeCategory} Questions` : 'Frequently Asked Questions'}
          <span className="ml-2 text-sm font-normal text-thrift-text-secondary">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-thrift-text-secondary">No results for "{search}". Try a different search term.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((faq, idx) => (
              <div key={idx} className="bg-thrift-surface border border-thrift-border rounded-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-thrift-text">{faq.q}</span>
                  {openIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-thrift-text-secondary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-thrift-text-secondary flex-shrink-0" />
                  )}
                </button>
                {openIndex === idx && (
                  <div className="px-5 pb-4 text-sm text-thrift-text-secondary leading-relaxed border-t border-thrift-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Still need help */}
        <div className="mt-12 bg-thrift-primary/5 border border-thrift-primary/20 rounded-card p-6">
          <h3 className="font-semibold text-thrift-text mb-2">Still need help?</h3>
          <p className="text-sm text-thrift-text-secondary mb-4">
            Our support team is available Monday – Friday, 9am – 6pm NPT.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/messages">
              <Button icon={<MessageCircle className="w-4 h-4" />} variant="outline">
                Live Chat
              </Button>
            </Link>
            <a href="mailto:support@thriftnest.com.np">
              <Button icon={<Mail className="w-4 h-4" />} variant="outline">
                Email Support
              </Button>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
