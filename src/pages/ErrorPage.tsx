import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-thrift-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="mb-8">
          <div className="relative w-48 h-48 mx-auto">
            {/* Empty box illustration */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Box */}
              <rect x="30" y="60" width="140" height="100" rx="8" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="2" />
              <rect x="30" y="60" width="140" height="30" rx="8" fill="#D1D5DB" />
              <line x1="30" y1="90" x2="170" y2="90" stroke="#D1D5DB" strokeWidth="2" />
              {/* Open flap */}
              <path d="M30 60 L100 20 L170 60" fill="none" stroke="#D1D5DB" strokeWidth="2" />
              {/* Question mark */}
              <text x="100" y="130" textAnchor="middle" fontSize="40" fill="#2D6A4F" fontFamily="Playfair Display" fontWeight="600">?</text>
            </svg>
          </div>
        </div>

        {/* 404 */}
        <h1 className="font-playfair text-8xl font-semibold text-thrift-primary mb-4">404</h1>

        {/* Message */}
        <h2 className="text-xl font-medium text-thrift-text mb-2">Looks like this page got thrifted away.</h2>
        <p className="text-thrift-text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button icon={<Home className="w-4 h-4" />} size="lg">
              Go back home
            </Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline" icon={<Search className="w-4 h-4" />} size="lg">
              Browse listings
            </Button>
          </Link>
        </div>

        {/* Additional help */}
        <p className="text-sm text-thrift-text-secondary mt-8">
          Need help?{' '}
          <Link to="/help" className="text-thrift-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
