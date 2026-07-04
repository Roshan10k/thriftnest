import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../lib/api';

type Step = 'email' | 'otp' | 'reset' | 'success';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTime, setResendTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (resendTime > 0) {
      const timer = setInterval(() => setResendTime((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTime]);

  const getPasswordStrength = (password: string) => {
    let s = 0;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) s++;
    return s;
  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-thrift-error', 'bg-thrift-warning', 'bg-thrift-success', 'bg-thrift-primary'];
  const checks = {
    length: formData.password.length >= 12,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const handleSendEmail = async () => {
    if (!email.trim()) { setErrors({ email: 'Email is required' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrors({ email: 'Please enter a valid email address' }); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setStep('otp');
      setResendTime(45);
    } catch {
      setApiError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTime > 0) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setResendTime(45);
    } catch {
      setApiError('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim() || otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit code from your email' });
      return;
    }
    setErrors({});
    setStep('reset');
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.password) newErrors.password = 'Password is required';
    else if (strength < 4) newErrors.password = 'Please meet all password requirements';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), otp.trim(), formData.password);
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setApiError(msg.includes('expired') ? 'Your code has expired. Please request a new one.' : msg.includes('Invalid') ? 'Invalid code. Please try again.' : msg);
    } finally {
      setLoading(false);
    }
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

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-thrift-text-secondary hover:text-thrift-text mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">Forgot your password?</h1>
            <p className="text-thrift-text-secondary mb-6">Enter your email address and we'll send you a 6-digit reset code.</p>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@email.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            {apiError && <p className="text-thrift-error text-sm mt-2">{apiError}</p>}
            <Button onClick={handleSendEmail} className="w-full mt-6" size="lg" loading={loading}>
              Send Reset Code
            </Button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
            <div className="w-16 h-16 rounded-full bg-thrift-success/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-thrift-success" />
            </div>
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2 text-center">Check your email</h1>
            <p className="text-thrift-text-secondary mb-6 text-center">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-thrift-text">{email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</span>
            </p>
            <Input
              label="6-digit code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              error={errors.otp}
            />
            {apiError && <p className="text-thrift-error text-sm mt-2">{apiError}</p>}
            <Button onClick={handleVerifyOtp} className="w-full mt-4" size="lg">
              Verify Code
            </Button>
            <p className="text-sm text-thrift-text-secondary mt-4 text-center">
              Didn't receive it?{' '}
              <button
                onClick={handleResend}
                disabled={resendTime > 0 || loading}
                className={resendTime > 0 ? 'text-thrift-text-secondary cursor-not-allowed' : 'text-thrift-primary hover:underline'}
              >
                {resendTime > 0 ? `Resend in 0:${resendTime.toString().padStart(2, '0')}` : 'Resend code'}
              </button>
            </p>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 'reset' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">Reset your password</h1>
            <p className="text-thrift-text-secondary mb-6">Create a new password for your account</p>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-thrift-text-secondary hover:text-thrift-text">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : 'bg-thrift-border'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-thrift-text-secondary">Password strength: {strengthLabels[strength - 1] || 'Weak'}</p>
                  </div>
                )}
                {formData.password && (
                  <div className="mt-3 space-y-1">
                    {[
                      { key: 'length', label: 'At least 12 characters' },
                      { key: 'uppercase', label: 'Uppercase letter' },
                      { key: 'number', label: 'Number' },
                      { key: 'special', label: 'Special character' },
                    ].map((req) => (
                      <div key={req.key} className="flex items-center gap-2 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${checks[req.key as keyof typeof checks] ? 'bg-thrift-success text-white' : 'bg-thrift-border text-thrift-text-secondary'}`}>
                          {checks[req.key as keyof typeof checks] && <Check className="w-3 h-3" />}
                        </div>
                        <span className={checks[req.key as keyof typeof checks] ? 'text-thrift-success' : 'text-thrift-text-secondary'}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-thrift-text-secondary hover:text-thrift-text">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>
            {apiError && <p className="text-thrift-error text-sm mt-3">{apiError}</p>}
            <Button onClick={handleResetPassword} className="w-full mt-6" size="lg" loading={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-8 shadow-card fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-thrift-success flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">Password Reset!</h1>
            <p className="text-thrift-text-secondary mb-6">Your password has been successfully reset. You can now log in with your new password.</p>
            <Button onClick={() => navigate('/login')} className="w-full" size="lg">Back to Login</Button>
          </div>
        )}
      </div>
    </div>
  );
}
