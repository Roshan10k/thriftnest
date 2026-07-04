import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Key, ArrowLeft, Copy, Check, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const DEMO_CODES = [
  'TN-A4K2-8XPQ',
  'TN-B7M9-3ZRW',
  'TN-C1N5-6YVE',
  'TN-D8P3-2TJH',
  'TN-E6Q7-9SLF',
  'TN-F0R4-5UBC',
  'TN-G2S1-7MKD',
  'TN-H9T6-1NGI',
];

export function BackupCodePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    if (DEMO_CODES.includes(code.trim().toUpperCase())) {
      setVerified(true);
      setError('');
      setTimeout(() => navigate('/dashboard/buyer'), 1500);
    } else {
      setError('Invalid backup code. Please try again or contact support.');
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(DEMO_CODES.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-thrift-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-thrift-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-playfair text-2xl font-semibold text-thrift-primary">ThriftNest</span>
          </Link>
        </div>

        <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-thrift-text-secondary hover:text-thrift-text mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {!verified ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-thrift-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-7 h-7 text-thrift-primary" />
                </div>
                <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                  Enter a backup code
                </h1>
                <p className="text-thrift-text-secondary text-sm">
                  Use one of your saved backup codes to verify your identity
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-thrift-text mb-1.5">
                  Backup Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  placeholder="TN-XXXX-XXXX"
                  className={`w-full px-3 py-2.5 font-mono text-center text-lg border rounded-input tracking-widest ${
                    error ? 'border-thrift-error' : 'border-thrift-border'
                  }`}
                />
                {error && (
                  <p className="mt-1.5 text-sm text-thrift-error flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                  </p>
                )}
              </div>

              <Button className="w-full" size="lg" onClick={handleVerify} disabled={!code.trim()}>
                Verify Code
              </Button>

              <div className="mt-4 p-3 bg-thrift-warning/10 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-thrift-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-thrift-warning">
                  Each backup code can only be used once. After use it will be invalidated.
                </p>
              </div>

              <p className="text-center text-sm text-thrift-text-secondary mt-4">
                Lost all backup codes?{' '}
                <a href="mailto:support@thriftnest.com.np" className="text-thrift-primary hover:underline">
                  Contact support
                </a>
              </p>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-thrift-success flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-playfair text-xl font-semibold text-thrift-text mb-2">Verified!</h2>
              <p className="text-thrift-text-secondary text-sm">Redirecting to your dashboard…</p>
            </div>
          )}
        </div>

        {/* Demo backup codes panel */}
        <div className="mt-6 bg-thrift-surface border border-thrift-border rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-thrift-primary" />
              <p className="text-sm font-medium text-thrift-text">Demo Backup Codes</p>
            </div>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 text-xs text-thrift-primary hover:underline"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy all'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_CODES.map((c) => (
              <button
                key={c}
                onClick={() => setCode(c)}
                className="font-mono text-xs text-left px-2 py-1.5 bg-thrift-bg rounded border border-thrift-border hover:border-thrift-primary transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
          <p className="text-xs text-thrift-text-secondary mt-2">Click a code to fill the field above</p>
        </div>
      </div>
    </div>
  );
}
