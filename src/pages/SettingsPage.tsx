import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, Lock, AlertTriangle, Eye, EyeOff, Key, Smartphone as SmartphoneIcon, MapPin, Camera, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DashboardNavbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { usersApi, api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { UserAvatar } from '../components/ui/UserAvatar';
import { toUser } from '../lib/mappers';

type Tab = 'profile' | 'security' | 'notifications' | 'privacy' | 'danger';

export function SettingsPage() {
  const { user: authUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    location: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Populate form from auth user once available
  useEffect(() => {
    if (authUser) {
      setProfileData({
        name: authUser.name,
        phone: authUser.phone ?? '',
        location: authUser.location ?? '',
      });
    }
  }, [authUser?.id]);

  const sidebarSections = [
    {
      items: [
        { icon: <User className="w-5 h-5" />, label: 'Back to Dashboard', path: authUser?.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer' },
      ],
    },
  ];

  const sidebarUser = {
    name: authUser?.name ?? '',
    avatar: authUser?.avatar,
    role: authUser?.role ?? 'buyer',
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock className="w-5 h-5" /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      const res = await usersApi.updateMe({
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
      });
      login(toUser(res.data));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await usersApi.updateAvatar(file);
      if (authUser) login({ ...authUser, avatar: res.data.avatar });
    } catch { /* ignore */ }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess(false);
    try {
      await usersApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ─── Multi-factor authentication ───────────────────────────────────────
  const [mfaStep, setMfaStep] = useState<'idle' | 'scan' | 'done'>('idle');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const startMfaSetup = async () => {
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await api.auth.mfaSetup();
      setMfaSetup({ secret: res.data.secret, qrCodeDataUrl: res.data.qrCodeDataUrl });
      setMfaStep('scan');
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Could not start 2FA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmMfaSetup = async () => {
    if (!mfaSetup || mfaCode.length !== 6) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await api.auth.mfaConfirm(mfaSetup.secret, mfaCode);
      setBackupCodes(res.data.backupCodes);
      setMfaStep('done');
      setMfaCode('');
      if (authUser) login({ ...authUser, mfaEnabled: true });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Invalid code — check your authenticator app');
    } finally {
      setMfaLoading(false);
    }
  };

  const cancelMfaSetup = () => {
    setMfaStep('idle');
    setMfaSetup(null);
    setMfaCode('');
    setMfaError('');
    setBackupCodes([]);
  };

  const disableMfa = async () => {
    const { confirmed, password } = await confirm({
      title: 'Disable two-factor authentication?',
      message: 'This removes the extra layer of security from your account. Enter your password to continue.',
      confirmLabel: 'Disable 2FA',
      danger: true,
      requirePassword: true,
    });
    if (!confirmed) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      await api.auth.mfaDisable(password);
      if (authUser) login({ ...authUser, mfaEnabled: false });
      cancelMfaSetup();
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Could not disable 2FA');
    } finally {
      setMfaLoading(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await usersApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thriftnest-data-${authUser?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'export'}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const { confirmed, password } = await confirm({
      title: 'Delete your account?',
      message: 'This permanently deletes your account and cannot be undone. Enter your password to confirm.',
      confirmLabel: 'Delete account',
      danger: true,
      requirePassword: true,
    });
    if (!confirmed) return;
    try {
      await usersApi.deleteAccount(password);
      logout();
      navigate('/');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-thrift-bg">
      <Sidebar sections={sidebarSections} user={sidebarUser} />
      <div className="ml-60">
        <DashboardNavbar />
        <main className="p-6">
          <h1 className="font-playfair text-2xl font-semibold text-thrift-text mb-6">Settings</h1>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Tabs */}
            <div className="sm:w-48 flex-shrink-0">
              <div className="bg-thrift-surface border border-thrift-border rounded-card overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-thrift-primary text-white'
                        : 'text-thrift-text-secondary hover:bg-thrift-bg'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activeTab === 'profile' && (
                <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 fade-in">
                  <h2 className="font-semibold text-thrift-text mb-6">Profile Information</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-thrift-border">
                    <div className="relative">
                      <UserAvatar src={authUser?.avatar} name={authUser?.name} className="w-20 h-20 rounded-full" />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-7 h-7 bg-thrift-primary text-white rounded-full flex items-center justify-center shadow-lift"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <p className="text-sm text-thrift-text-secondary mb-2">Click the camera to change your avatar</p>
                      <button onClick={() => avatarInputRef.current?.click()} className="text-sm text-thrift-primary hover:underline">
                        Upload new photo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Display Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                    <Input
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      icon={<SmartphoneIcon className="w-4 h-4" />}
                    />
                    <Input
                      label="Location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>

                  {profileError && <p className="mt-3 text-sm text-thrift-error">{profileError}</p>}
                  {profileSuccess && <p className="mt-3 text-sm text-thrift-success">Profile saved successfully.</p>}

                  <Button className="mt-6" onClick={handleSaveProfile} disabled={profileSaving}>
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6 fade-in">
                  {/* Change Password */}
                  <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                    <h2 className="font-semibold text-thrift-text mb-6">Change Password</h2>

                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          label="Current Password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          rightIcon={
                            <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="text-thrift-text-secondary">
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                      </div>

                      <div className="relative">
                        <Input
                          label="New Password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          rightIcon={
                            <button onClick={() => setShowNewPassword(!showNewPassword)} className="text-thrift-text-secondary">
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                        {passwordData.newPassword && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[0, 1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1 flex-1 rounded-full ${
                                    i < passwordStrength
                                      ? passwordStrength === 4 ? 'bg-thrift-primary'
                                        : passwordStrength === 3 ? 'bg-thrift-success'
                                        : passwordStrength === 2 ? 'bg-thrift-warning'
                                        : 'bg-thrift-error'
                                      : 'bg-thrift-border'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Input
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        rightIcon={
                          <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-thrift-text-secondary">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                    </div>

                    {passwordError && <p className="mt-3 text-sm text-thrift-error">{passwordError}</p>}
                    {passwordSuccess && <p className="mt-3 text-sm text-thrift-success">Password updated successfully.</p>}

                    <div className="flex items-center justify-end mt-4">
                      <Button
                        onClick={handleChangePassword}
                        disabled={passwordSaving || !passwordData.newPassword || !passwordData.currentPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      >
                        {passwordSaving ? 'Updating…' : 'Update Password'}
                      </Button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-thrift-text">Two-Factor Authentication</h2>
                      {authUser?.mfaEnabled && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-thrift-success font-medium">
                          <Shield className="w-4 h-4" /> Enabled
                        </span>
                      )}
                    </div>

                    {mfaError && (
                      <p className="text-sm text-thrift-error mb-4">{mfaError}</p>
                    )}

                    {/* Enabled state */}
                    {authUser?.mfaEnabled && mfaStep !== 'done' && (
                      <>
                        <p className="text-sm text-thrift-text-secondary mb-6">
                          Your account is protected with an authenticator app. You'll be asked for a 6-digit code when you log in.
                        </p>
                        <Button
                          variant="outline"
                          className="text-thrift-error border-thrift-error hover:bg-thrift-error/5"
                          loading={mfaLoading}
                          onClick={disableMfa}
                        >
                          Disable 2FA
                        </Button>
                      </>
                    )}

                    {/* Not enabled — intro + start */}
                    {!authUser?.mfaEnabled && mfaStep === 'idle' && (
                      <>
                        <p className="text-sm text-thrift-text-secondary mb-6">
                          Add an extra layer of security with an authenticator app such as Google Authenticator or Authy.
                        </p>
                        <Button variant="outline" icon={<Key className="w-4 h-4" />} loading={mfaLoading} onClick={startMfaSetup}>
                          Set up 2FA
                        </Button>
                      </>
                    )}

                    {/* Scan step */}
                    {mfaStep === 'scan' && mfaSetup && (
                      <div className="space-y-4">
                        <p className="text-sm text-thrift-text-secondary">
                          1. Scan this QR code with your authenticator app, or enter the key manually.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <img src={mfaSetup.qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40 border border-thrift-border rounded-lg bg-white p-1" />
                          <div className="text-sm">
                            <p className="text-thrift-text-secondary mb-1">Manual entry key:</p>
                            <code className="block font-mono text-xs bg-thrift-bg border border-thrift-border rounded px-2 py-1.5 break-all">
                              {mfaSetup.secret}
                            </code>
                          </div>
                        </div>
                        <p className="text-sm text-thrift-text-secondary">2. Enter the 6-digit code from your app to confirm.</p>
                        <div className="flex gap-3 items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-36 px-4 py-2 border border-thrift-border rounded-input font-mono tracking-widest text-center"
                          />
                          <Button loading={mfaLoading} disabled={mfaCode.length !== 6} onClick={confirmMfaSetup}>
                            Verify &amp; Enable
                          </Button>
                          <Button variant="ghost" onClick={cancelMfaSetup}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* Done — show backup codes once */}
                    {mfaStep === 'done' && (
                      <div className="space-y-4">
                        <p className="text-sm text-thrift-success font-medium flex items-center gap-1.5">
                          <Shield className="w-4 h-4" /> Two-factor authentication is now enabled.
                        </p>
                        <div className="bg-thrift-warning/10 border border-thrift-warning/40 rounded-lg p-4">
                          <p className="text-sm font-medium text-thrift-text mb-1">Save your backup codes</p>
                          <p className="text-xs text-thrift-text-secondary mb-3">
                            Store these somewhere safe. Each code can be used once if you lose access to your authenticator app. They won't be shown again.
                          </p>
                          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                            {backupCodes.map((code) => (
                              <span key={code} className="bg-thrift-surface border border-thrift-border rounded px-2 py-1 text-center">{code}</span>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => setMfaStep('idle')}>Done</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 fade-in">
                  <h2 className="font-semibold text-thrift-text mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    {[
                      { label: 'Email Notifications', desc: 'Receive updates via email' },
                      { label: 'Push Notifications', desc: 'Browser push notifications' },
                      { label: 'New Messages', desc: 'When you receive new messages' },
                      { label: 'Order Updates', desc: 'Status changes on your orders' },
                      { label: 'Price Drops', desc: 'Items in your wishlist drop in price' },
                      { label: 'New Offers', desc: 'When buyers make offers on your listings' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-thrift-text">{item.label}</p>
                          <p className="text-sm text-thrift-text-secondary">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={idx < 4} />
                          <div className="w-11 h-6 bg-thrift-border peer-focus:ring-2 peer-focus:ring-thrift-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-thrift-primary" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="bg-thrift-surface border border-thrift-border rounded-card p-6 fade-in">
                  <h2 className="font-semibold text-thrift-text mb-6">Privacy Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-thrift-text mb-2">Profile Visibility</label>
                      <select className="w-full px-3 py-2 bg-thrift-bg border border-thrift-border rounded-input">
                        <option>Public</option>
                        <option>Registered users only</option>
                        <option>Private</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-thrift-text mb-2">Show Location</label>
                      <select className="w-full px-3 py-2 bg-thrift-bg border border-thrift-border rounded-input">
                        <option>City only</option>
                        <option>Exact location</option>
                        <option>Hidden</option>
                      </select>
                    </div>
                    <div className="pt-4 border-t border-thrift-border">
                      <Button variant="outline" icon={<Download className="w-4 h-4" />} loading={exporting} onClick={handleExportData}>
                        {exporting ? 'Preparing…' : 'Download my data (JSON)'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="bg-thrift-surface border-2 border-thrift-error rounded-card p-6 fade-in">
                  <h2 className="font-semibold text-thrift-error mb-2">Danger Zone</h2>
                  <p className="text-sm text-thrift-text-secondary mb-6">These actions are irreversible. Please be careful.</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-thrift-error/5 rounded-lg">
                      <div>
                        <p className="font-medium text-thrift-text">Delete Account Permanently</p>
                        <p className="text-sm text-thrift-text-secondary">All data will be lost</p>
                      </div>
                      <Button variant="danger" onClick={handleDeleteAccount}>Delete Account</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
