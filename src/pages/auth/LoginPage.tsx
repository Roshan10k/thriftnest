import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Eye, EyeOff, AlertTriangle, Lock, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toUser } from '../../contexts/AuthContext';

type Step = 'credentials' | 'mfa' | 'locked';
type LockoutReason = 'attempts' | 'suspicious';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    otp: ['', '', '', '', '', ''],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lockoutTime, setLockoutTime] = useState(900);
  const [otpTime, setOtpTime] = useState(30);

  useEffect(() => {
    if (step === 'locked' && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep('credentials');
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, lockoutTime]);

  useEffect(() => {
    if (step === 'mfa' && otpTime > 0) {
      const timer = setInterval(() => {
        setOtpTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, otpTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.auth.login({ email: formData.email, password: formData.password });
      const payload = res.data;

      if ('mfaRequired' in payload && payload.mfaRequired) {
        setPendingUserId(payload.userId);
        setStep('mfa');
        return;
      }

      const { user, accessToken, refreshToken } = payload as {
        user: Record<string, unknown>;
        accessToken: string;
        refreshToken: string;
      };
      login(toUser(user), accessToken, refreshToken);
      navigate(user.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer');
    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (err instanceof ApiError && err.status === 423) {
        setStep('locked');
        setLockoutTime(900);
      } else {
        setErrors({ password: err instanceof ApiError ? err.message : 'Invalid email or password' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...formData.otp];
    newOtp[index] = value;

    setFormData({ ...formData, otp: newOtp });

    const nextInput = document.getElementById(`mfa-otp-${index + 1}`);
    if (value && nextInput) {
      nextInput.focus();
    }
  };

  const handleMfaVerify = async () => {
    const mfaToken = formData.otp.join('');
    if (mfaToken.length !== 6) return;
    setIsSubmitting(true);
    try {
      const res = await api.auth.login({ email: formData.email, password: formData.password, mfaToken });
      const payload = res.data as { user: Record<string, unknown>; accessToken: string; refreshToken: string };
      login(toUser(payload.user), payload.accessToken, payload.refreshToken);
      navigate(payload.user.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer');
    } catch (err) {
      setErrors({ otp: err instanceof ApiError ? err.message : 'Invalid MFA code' });
    } finally {
      setIsSubmitting(false);
    }
  };
  void pendingUserId; // used for future: pass userId to backup-code flow

  const handleResendOtp = () => {
    setOtpTime(30);
    setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
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
            <span className="font-playfair text-2xl font-semibold text-thrift-primary">
              ThriftNest
            </span>
          </Link>
        </div>

        {/* Credentials Step */}
        {step === 'credentials' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
            <h1 className="font-playfair text-2xl font-semibold text-thrift-text text-center mb-6">
              Welcome back
            </h1>

            {/* Failed Attempts Warning */}
            {failedAttempts >= 2 && failedAttempts < 5 && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                  failedAttempts >= 4 ? 'bg-thrift-error/10 border border-thrift-error/20' : 'bg-thrift-warning/10 border border-thrift-warning/20'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 ${
                    failedAttempts >= 4 ? 'text-thrift-error' : 'text-thrift-warning'
                  }`}
                />
                <div>
                  <p className={`text-sm font-medium ${
                    failedAttempts >= 4 ? 'text-thrift-error' : 'text-thrift-warning'
                  }`}>
                    {failedAttempts >= 4
                      ? '1 attempt remaining. Consider resetting your password.'
                      : `${5 - failedAttempts} attempts remaining before your account is locked`}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="roshan@email.com"
                icon={<Mail className="w-4 h-4" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-thrift-text-secondary hover:text-thrift-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded border-thrift-border text-thrift-primary focus:ring-thrift-primary/20"
                  />
                  <span className="text-sm text-thrift-text-secondary">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-thrift-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button onClick={handleLogin} className="w-full" size="lg" loading={isSubmitting}>
                {isSubmitting ? 'Logging in…' : 'Log in'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-thrift-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-thrift-surface text-sm text-thrift-text-secondary">or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.57-3.57C17.45 1.88 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }>
                Continue with Google
              </Button>

              <p className="text-sm text-thrift-text-secondary text-center">
                Don't have an account?{' '}
                <Link to="/register" className="text-thrift-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* MFA Step */}
        {step === 'mfa' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-thrift-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-thrift-primary" />
              </div>
              <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                Enter verification code
              </h1>
              <p className="text-thrift-text-secondary">
                Open your authenticator app and enter the 6-digit code
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-6">
              {formData.otp.map((digit, index) => (
                <input
                  key={index}
                  id={`mfa-otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-semibold bg-thrift-surface border border-thrift-border rounded-input focus:border-thrift-primary focus:ring-2 focus:ring-thrift-primary/20"
                />
              ))}
            </div>

            {/* hCaptcha Placeholder */}
            <div className="border border-thrift-border rounded-lg p-4 mb-4 bg-thrift-bg">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-6 h-6 border-2 border-thrift-border rounded flex items-center justify-center">
                  <input type="checkbox" className="sr-only" />
                </div>
                <span className="text-sm text-thrift-text-secondary">I'm not a robot</span>
                <div className="ml-auto text-thrift-text-secondary">
                  <svg width="40" height="40" viewBox="0 0 40 40" className="text-gray-400">
                    <rect width="40" height="40" fill="currentColor" rx="4"/>
                  </svg>
                </div>
              </label>
            </div>

            <Button
              onClick={handleMfaVerify}
              className="w-full"
              size="lg"
              disabled={formData.otp.join('').length < 6}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Verifying…' : 'Verify'}
            </Button>

            <div className="flex justify-between mt-4 text-sm">
              <button
                onClick={handleResendOtp}
                disabled={otpTime > 0}
                className={`${
                  otpTime > 0
                    ? 'text-thrift-text-secondary cursor-not-allowed'
                    : 'text-thrift-primary hover:underline'
                }`}
              >
                Resend code {otpTime > 0 && `(${formatTime(otpTime)})`}
              </button>
              <Link to="/backup-code" className="text-thrift-text-secondary hover:text-thrift-text">
                Use a backup code instead
              </Link>
            </div>
          </div>
        )}

        {/* Locked State */}
        {step === 'locked' && (
          <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 shadow-card fade-in">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-thrift-error/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-thrift-error" />
              </div>
              <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                Account temporarily locked
              </h1>
              <p className="text-thrift-text-secondary mb-6">
                Too many failed attempts. Try again in {formatTime(lockoutTime)} or reset your password.
              </p>

              <div className="text-4xl font-mono text-thrift-text mb-6">
                {formatTime(lockoutTime)}
              </div>

              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full"
                size="lg"
              >
                Reset Password
              </Button>

              <p className="text-sm text-thrift-text-secondary mt-4">
                Need help?{' '}
                <Link to="/help" className="text-thrift-primary hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
