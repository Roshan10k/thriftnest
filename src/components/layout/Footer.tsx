import { Link } from 'react-router-dom';
import { Leaf, Facebook, Instagram, Twitter, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-thrift-bg border-t border-thrift-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-thrift-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-playfair text-xl font-semibold text-thrift-primary">
                ThriftNest
              </span>
            </Link>
            <p className="text-sm text-thrift-text-secondary leading-relaxed">
              Give things a second life. Buy and sell pre-loved items in your community. Good for your wallet. Better for the planet.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 bg-thrift-border/50 rounded-lg text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-thrift-border/50 rounded-lg text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-thrift-border/50 rounded-lg text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="font-semibold text-thrift-text mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="font-semibold text-thrift-text mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link to="/verification" className="text-sm text-thrift-text-secondary hover:text-thrift-primary transition-colors">
                  Verification
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="font-semibold text-thrift-text mb-4">Newsletter</h3>
            <p className="text-sm text-thrift-text-secondary mb-4">
              Get weekly deals and updates from ThriftNest.
            </p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="px-4 py-2 text-sm bg-thrift-surface border border-thrift-border rounded-input"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-thrift-primary rounded-btn hover:bg-thrift-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-thrift-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-thrift-text-secondary">
            © 2024 ThriftNest. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-thrift-text-secondary">
            <Shield className="w-4 h-4" />
            <span>Secured by Stripe · TLS 1.3 Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
