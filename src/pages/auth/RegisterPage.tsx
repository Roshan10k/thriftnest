import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, User, Mail, Phone, Eye, EyeOff, Check, ShoppingCart, Package, Repeat } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api, ApiError, saveTokens } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toUser } from '../../contexts/AuthContext';

type Role = 'buyer' | 'seller' | 'both';
type Step = 1 | 2 | 3 | 'success';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const preselectedRole = (searchParams.get('role') as Role | null) ?? null;
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+977 ',
    password: '',
    confirmPassword: '',
    role: preselectedRole,
    otp: ['', '', '', '', '', ''],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) strength++;
    });

    return { strength, checks };
  };

  const { strength, checks } = getPasswordStrength(formData.password);

  const strengthLabels = ['Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-thrift-error', 'bg-thrift-warning', 'bg-thrift-success', 'bg-thrift-primary'];

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim() || formData.phone === '+977 ') {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (strength < 4) {
      newErrors.password = 'Please meet all password requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const dashboardForRole = (role: Role | null) =>
    role === 'seller' || role === 'both' ? '/dashboard/seller' : '/dashboard/buyer';

  const handleStep1Next = () => {
    if (validateStep1()) {
      // Skip role selection step if role was pre-selected via query param
      if (preselectedRole) {
        handleStep2Next();
      } else {
        setStep(2);
      }
    }
  };

  const handleStep2Next = async () => {
    if (!formData.role) return;
    setIsSubmitting(true);
    setApiError('');
    try {
      const res = await api.auth.register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        role: formData.role,
        phone: formData.phone !== '+977 ' ? formData.phone : undefined,
      });
      const { user, accessToken, refreshToken } = res.data;
      saveTokens(accessToken, refreshToken);
      login(toUser(user), accessToken, refreshToken);
      setStep(3);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
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

    // Auto-advance to next input
    const nextInput = document.getElementById(`otp-${index + 1}`);
    if (value && nextInput) {
      nextInput.focus();
    }
  };

  const handleStep3Submit = () => {
    const otpValue = formData.otp.join('');
    if (otpValue.length === 6) {
      // Simulate verification
      setStep('success');
      setTimeout(() => {
        navigate(dashboardForRole(formData.role));
      }, 2000);
    }
  };

  const handleSkip = () => {
    setStep('success');
    setTimeout(() => {
      navigate(dashboardForRole(formData.role));
    }, 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-thrift-primary flex-col justify-between p-12">
        <div>
          <Link to="/" className="flex items-center gap-2 inline-flex">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-thrift-primary" />
            </div>
            <span className="font-playfair text-2xl font-semibold text-white">
              ThriftNest
            </span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-72 h-72">
            {/* Floating product illustrations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center animate-pulse-soft">
              <Package className="w-16 h-16 text-white" />
            </div>
            <div className="absolute bottom-12 left-8 w-32 h-32 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center transform -rotate-6" style={{ animationDelay: '0.5s' }}>
              <ShoppingCart className="w-12 h-12 text-white" />
            </div>
            <div className="absolute bottom-8 right-8 w-28 h-28 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center transform rotate-12" style={{ animationDelay: '1s' }}>
              <Repeat className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="font-playfair text-3xl font-semibold text-white text-center mt-8">
            Join thousands giving things a second life
          </h2>
          <p className="text-white/80 text-center mt-4 max-w-sm">
            Save money, reduce waste, and discover unique pre-owned treasures in your community
          </p>
        </div>

        <div className="flex items-center gap-2 text-white/60 text-sm">
          <span>© 2024 ThriftNest</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-thrift-bg">
        <div className="w-full max-w-md">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex items-center ${
                    s === 2 ? 'hidden sm:flex' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      (typeof step === 'number' && step >= s) || step === 'success'
                        ? 'bg-thrift-primary text-white'
                        : 'bg-thrift-border text-thrift-text-secondary'
                    }`}
                  >
                    {typeof step === 'number' && step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`hidden sm:block w-24 h-1 mx-2 rounded-full transition-colors ${
                        (typeof step === 'number' && step > s) || step === 'success'
                          ? 'bg-thrift-primary'
                          : 'bg-thrift-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-thrift-text-secondary">
              Step {typeof step === 'number' ? step : 3} of 3
            </p>
          </div>

          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="fade-in">
              <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                Create your account
              </h1>
              <p className="text-thrift-text-secondary mb-8">
                Enter your details to set up your account
              </p>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Roshan Sharma"
                  icon={<User className="w-4 h-4" />}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  error={errors.fullName}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="roshan@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                />

                <Input
                  label="Phone Number"
                  placeholder="9841234567"
                  icon={<Phone className="w-4 h-4" />}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={errors.phone}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
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

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < strength ? strengthColors[strength - 1] : 'bg-thrift-border'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-thrift-text-secondary">
                        Password strength: {strengthLabels[strength - 1] || 'Weak'}
                      </p>
                    </div>
                  )}

                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="mt-3 space-y-1">
                      {[
                        { key: 'length', label: 'At least 12 characters' },
                        { key: 'uppercase', label: 'Uppercase letter' },
                        { key: 'number', label: 'Number' },
                        { key: 'special', label: 'Special character' },
                      ].map((req) => (
                        <div
                          key={req.key}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              checks[req.key as keyof typeof checks]
                                ? 'bg-thrift-success text-white'
                                : 'bg-thrift-border text-thrift-text-secondary'
                            }`}
                          >
                            {checks[req.key as keyof typeof checks] && (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                          <span
                            className={
                              checks[req.key as keyof typeof checks]
                                ? 'text-thrift-success'
                                : 'text-thrift-text-secondary'
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-thrift-text-secondary hover:text-thrift-text"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <Button
                onClick={handleStep1Next}
                className="w-full mt-6"
                size="lg"
              >
                Continue
              </Button>

              <p className="text-sm text-thrift-text-secondary text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-thrift-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <div className="fade-in">
              <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                How will you use ThriftNest?
              </h1>
              <p className="text-thrift-text-secondary mb-8">
                Select your primary activity on the platform
              </p>

              <div className="space-y-4">
                {[
                  {
                    role: 'buyer' as Role,
                    icon: <ShoppingCart className="w-8 h-8" />,
                    title: 'I want to Buy',
                    description: 'Browse and purchase items from sellers',
                  },
                  {
                    role: 'seller' as Role,
                    icon: <Package className="w-8 h-8" />,
                    title: 'I want to Sell',
                    description: 'List and sell my pre-owned items',
                  },
                  {
                    role: 'both' as Role,
                    icon: <Repeat className="w-8 h-8" />,
                    title: 'I want to do Both',
                    description: 'Buy and sell items on the platform',
                  },
                ].map((option) => (
                  <button
                    key={option.role}
                    onClick={() => setFormData({ ...formData, role: option.role })}
                    className={`w-full p-4 border-2 rounded-card flex items-center gap-4 transition-all ${
                      formData.role === option.role
                        ? 'border-thrift-primary bg-thrift-primary/5'
                        : 'border-thrift-border hover:border-thrift-primary/50'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
                        formData.role === option.role
                          ? 'bg-thrift-primary text-white'
                          : 'bg-thrift-bg text-thrift-text-secondary'
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-thrift-text">{option.title}</h3>
                      <p className="text-sm text-thrift-text-secondary">{option.description}</p>
                    </div>
                    {formData.role === option.role && (
                      <Check className="w-5 h-5 text-thrift-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                {apiError && (
                  <p className="text-sm text-thrift-error text-center">{apiError}</p>
                )}
                <Button
                  onClick={handleStep2Next}
                  className="flex-1"
                  disabled={!formData.role}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Creating account…' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: MFA Setup */}
          {step === 3 && (
            <div className="fade-in">
              <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                Set up Two-Factor Authentication
              </h1>
              <p className="text-thrift-text-secondary mb-8">
                Adds an extra layer of protection to your account
              </p>

              {/* QR Code Placeholder */}
              <div className="border-2 border-dashed border-thrift-border rounded-card p-6 mb-6">
                <div className="w-44 h-44 mx-auto bg-thrift-bg rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto bg-thrift-border rounded grid grid-cols-5 gap-0.5 p-2 mb-2">
                      {[...Array(25)].map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${Math.random() > 0.5 ? 'bg-thrift-text' : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-thrift-text-secondary">QR Code</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-thrift-text-secondary">
                  1. Download Google Authenticator or Authy
                </p>
                <p className="text-sm text-thrift-text-secondary">
                  2. Scan the QR code with your authenticator app
                </p>
                <p className="text-sm text-thrift-text-secondary">
                  3. Enter the 6-digit code below
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-6">
                {formData.otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-14 text-center text-xl font-semibold bg-thrift-surface border border-thrift-border rounded-input focus:border-thrift-primary focus:ring-2 focus:ring-thrift-primary/20"
                  />
                ))}
              </div>

              <Button
                onClick={handleStep3Submit}
                className="w-full"
                size="lg"
                disabled={formData.otp.join('').length < 6}
              >
                Verify & Create Account
              </Button>

              <button
                onClick={handleSkip}
                className="w-full mt-4 text-sm text-thrift-text-secondary hover:text-thrift-text"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="fade-in text-center py-8">
              <div className="w-20 h-20 rounded-full bg-thrift-success flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-playfair text-2xl font-semibold text-thrift-text mb-2">
                Account Created!
              </h2>
              <p className="text-thrift-text-secondary">
                Redirecting to your dashboard...
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-2 border-thrift-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
