import { Link } from 'react-router-dom';
import { Leaf, Shield, Users, Recycle, TrendingUp, Heart, CheckCircle } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const stats = [
  { value: '10,000+', label: 'Items Listed' },
  { value: '3,500+', label: 'Active Users' },
  { value: 'NPR 2M+', label: 'Value Traded' },
  { value: '4.8', label: 'Avg. Seller Rating' },
];

const values = [
  {
    icon: <Recycle className="w-6 h-6 text-thrift-primary" />,
    title: 'Sustainability First',
    desc: 'Every item sold on ThriftNest extends its life and keeps it out of landfill. Small actions, big impact.',
  },
  {
    icon: <Shield className="w-6 h-6 text-thrift-primary" />,
    title: 'Security by Design',
    desc: 'End-to-end encrypted payments, MFA on every account, and verified seller profiles — security is not an afterthought.',
  },
  {
    icon: <Users className="w-6 h-6 text-thrift-primary" />,
    title: 'Community Driven',
    desc: 'Buyers and sellers from across Nepal connect through transparent ratings, honest descriptions, and open chat.',
  },
  {
    icon: <Heart className="w-6 h-6 text-thrift-primary" />,
    title: 'Fair for Everyone',
    desc: 'A minimal platform fee keeps ThriftNest running while keeping prices affordable for buyers and profits real for sellers.',
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-thrift-bg">
      <Navbar />

      {/* Hero */}
      <section className="paper-texture py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 bg-thrift-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="font-playfair text-3xl font-semibold text-thrift-primary">ThriftNest</span>
          </div>
          <h1 className="font-playfair text-4xl font-semibold text-thrift-text leading-tight mb-4">
            Nepal's most trusted marketplace for pre-loved things
          </h1>
          <p className="text-lg text-thrift-text-secondary leading-relaxed">
            ThriftNest was built on a simple belief: giving things a second life is good for people and good for the planet.
            We connect buyers and sellers across Nepal in a safe, verified, and sustainable way.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link to="/browse"><Button size="lg">Browse Listings</Button></Link>
            <Link to="/register"><Button variant="outline" size="lg">Join ThriftNest</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-thrift-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-playfair text-3xl font-semibold text-white">{s.value}</p>
                <p className="text-white/70 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-thrift-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-8">
            Our Story
          </h2>
          <div className="prose prose-sm text-thrift-text-secondary space-y-4">
            <p>
              ThriftNest started as a final-year university project with one goal: prove that a secure, locally focused
              second-hand marketplace could be built from scratch — without compromising on user safety or experience.
            </p>
            <p>
              We noticed that existing platforms left buyers exposed to scams, offered no payment protection, and treated
              security as a checkbox. We wanted to do better. ThriftNest ships with multi-factor authentication, rate-limited
              login, end-to-end payment encryption, and a full RBAC model baked in from day one.
            </p>
            <p>
              Beyond security, we care about sustainability. Every time a piece of clothing, a book, or a camera finds a
              new owner instead of a landfill, ThriftNest did its job.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-thrift-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-12">
            What We Stand For
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-thrift-surface border border-thrift-border rounded-card p-6 flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-thrift-primary/10 flex items-center justify-center flex-shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-thrift-text mb-1">{v.title}</h3>
                  <p className="text-sm text-thrift-text-secondary leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Commitment */}
      <section className="py-16 bg-thrift-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-8">
            Our Security Commitment
          </h2>
          <div className="space-y-3">
            {[
              'TOTP-based Multi-Factor Authentication on every account',
              'Bcrypt password hashing with minimum 12-character policy',
              'Rate limiting and account lockout on all auth endpoints',
              'Role-Based Access Control (RBAC) with least-privilege defaults',
              'Stripe-powered payments — card data never touches our servers',
              'Activity logs for every security-relevant event',
              'Secure HttpOnly, SameSite=Strict session cookies',
              'OWASP Top 10 tested via internal penetration testing',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-thrift-success flex-shrink-0" />
                <span className="text-thrift-text-secondary text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-thrift-primary/5">
        <div className="max-w-xl mx-auto px-4 text-center">
          <TrendingUp className="w-12 h-12 text-thrift-primary mx-auto mb-4" />
          <h2 className="font-playfair text-2xl font-semibold text-thrift-text mb-3">
            Ready to join the community?
          </h2>
          <p className="text-thrift-text-secondary mb-6">
            Sign up free. List in minutes. Buy with confidence.
          </p>
          <Link to="/register">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
