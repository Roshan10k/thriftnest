import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, Lock, AlertTriangle, Eye, EyeOff, Key, Smartphone as SmartphoneIcon, MapPin, Camera, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DashboardNavbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toUser } from '../lib/mappers';

type Tab = 'profile' | 'security' | 'notifications' | 'privacy' | 'danger';

export function SettingsPage() {
  const { user: authUser, login, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your account. Are you sure?');
    if (!confirmed) return;
    const password = window.prompt('Enter your password to confirm:');
    if (!password) return;
    try {
      await usersApi.deleteAccount(password);
      logout();
      navigate('/');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete account');
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
                      <img
                        src={authUser?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.name ?? 'U')}&background=random`}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
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

                  {/* 2FA placeholder */}
                  <div className="bg-thrift-surface border border-thrift-border rounded-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-thrift-text">Two-Factor Authentication</h2>
                    </div>
                    <p className="text-sm text-thrift-text-secondary mb-6">
                      Add an extra layer of security to your account with an authenticator app.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" icon={<Key className="w-4 h-4" />}>Set up 2FA</Button>
                    </div>
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
                      <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                        Download my data (JSON)
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
